import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, Req, UseFilters, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";

import { SessionGuard, type AuthenticatedRequest } from "../../../auth/http/session.guard";
import { QuoteRequestDto } from "../../quotes/http/dtos/quote-request.dto";
import { ApiError, ApiJsonBody, badRequestBodySchema } from "../../../shared/http/openapi";
import { ZodValidationPipe } from "../../../shared/http/zod-validation.pipe";
import { ConfirmBooking } from "../application/confirm-booking.use-case";
import { GetBooking } from "../application/get-booking.use-case";
import { ListMyBookings } from "../application/list-my-bookings.use-case";
import { SaveCustomerDetails } from "../application/save-customer-details.use-case";
import { SaveSchedule } from "../application/save-schedule.use-case";
import { SaveServices } from "../application/save-services.use-case";
import { StartBooking } from "../application/start-booking.use-case";
import { BookingIdPipe } from "./booking-id.pipe";
import { BookingsExceptionFilter } from "./bookings-exception.filter";
import { bookingConflictSchema } from "./dtos/booking-conflict.dto";
import { BookingListItemDto } from "./dtos/booking-list-item.dto";
import { BookingResponseDto } from "./dtos/booking-response.dto";
import { CustomerDetailsRequestDto } from "./dtos/customer-details-request.dto";
import { ServicesRequestDto } from "./dtos/services-request.dto";

// The 3-step booking flow (CONTEXT §1.2); a customer only reaches their own bookings.
@Controller("bookings")
@UseGuards(SessionGuard)
@UseFilters(BookingsExceptionFilter)
@ApiTags("bookings")
@ApiCookieAuth()
@ApiError(401, "No valid session cookie")
@ApiError(403, "The user has no customer (the admin cannot book)")
export class BookingsController {
  constructor(
    @Inject(StartBooking) private readonly startBooking: StartBooking,
    @Inject(GetBooking) private readonly getBooking: GetBooking,
    @Inject(ListMyBookings) private readonly listMyBookings: ListMyBookings,
    @Inject(SaveCustomerDetails) private readonly saveCustomerDetails: SaveCustomerDetails,
    @Inject(SaveSchedule) private readonly saveSchedule: SaveSchedule,
    @Inject(SaveServices) private readonly saveServices: SaveServices,
    @Inject(ConfirmBooking) private readonly confirmBooking: ConfirmBooking,
  ) {}

  // The schedule shares the quote's request shape: the draft starts from the quoted slot.
  @Post()
  @ApiOperation({ summary: "Start a draft booking from an available quote" })
  @ApiCreatedResponse({ description: "The new draft, priced", standardSchema: BookingResponseDto.schema })
  @ApiError(400, "Invalid body or slot", badRequestBodySchema)
  @ApiError(404, "Room not found")
  @ApiError(409, "The slot is not available", bookingConflictSchema("slot_unavailable"))
  @ApiJsonBody(QuoteRequestDto.schema)
  async start(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(QuoteRequestDto)) body: QuoteRequestDto,
  ): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.startBooking.execute(request.session.userId, body));
  }

  @Get()
  @ApiOperation({ summary: "List the user's bookings in every status, newest created first (My bookings)" })
  @ApiOkResponse({ description: "The user's bookings", standardSchema: BookingListItemDto.schema.array() })
  async list(@Req() request: AuthenticatedRequest): Promise<BookingListItemDto[]> {
    const summaries = await this.listMyBookings.execute(request.session.userId);
    return summaries.map((summary) => BookingListItemDto.from(summary));
  }

  @Get(":id")
  @ApiOperation({ summary: "Read one of the user's bookings" })
  @ApiParam({ name: "id", type: String, format: "uuid" })
  @ApiOkResponse({ description: "The booking", standardSchema: BookingResponseDto.schema })
  @ApiError(404, "Booking not found (or another customer's)")
  async get(@Req() request: AuthenticatedRequest, @Param("id", BookingIdPipe) id: string): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.getBooking.execute(request.session.userId, id));
  }

  @Put(":id/customer")
  @ApiOperation({ summary: "Step 1: save the customer details (updates the user's customer)" })
  @ApiParam({ name: "id", type: String, format: "uuid" })
  @ApiOkResponse({ description: "The draft", standardSchema: BookingResponseDto.schema })
  @ApiError(400, "Invalid body", badRequestBodySchema)
  @ApiError(404, "Booking not found (or another customer's)")
  @ApiError(409, "The email belongs to another customer, or the booking is no longer a draft", bookingConflictSchema("email_taken", "not_editable"))
  @ApiJsonBody(CustomerDetailsRequestDto.schema)
  async saveCustomer(
    @Req() request: AuthenticatedRequest,
    @Param("id", BookingIdPipe) id: string,
    @Body(new ZodValidationPipe(CustomerDetailsRequestDto)) body: CustomerDetailsRequestDto,
  ): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.saveCustomerDetails.execute(request.session.userId, id, body));
  }

  @Put(":id/schedule")
  @ApiOperation({ summary: "Step 2: save the room and schedule (priced again, D-25)" })
  @ApiParam({ name: "id", type: String, format: "uuid" })
  @ApiOkResponse({ description: "The draft, priced again", standardSchema: BookingResponseDto.schema })
  @ApiError(400, "Invalid body or slot", badRequestBodySchema)
  @ApiError(404, "Booking or room not found")
  @ApiError(
    409,
    "The slot is not available, step 1 was not saved, or the booking is no longer a draft",
    bookingConflictSchema("slot_unavailable", "step_not_reached", "not_editable"),
  )
  @ApiJsonBody(QuoteRequestDto.schema)
  async saveScheduleOf(
    @Req() request: AuthenticatedRequest,
    @Param("id", BookingIdPipe) id: string,
    @Body(new ZodValidationPipe(QuoteRequestDto)) body: QuoteRequestDto,
  ): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.saveSchedule.execute(request.session.userId, id, body));
  }

  @Put(":id/services")
  @ApiOperation({ summary: "Step 3: save the additional services (optional; priced again, D-25)" })
  @ApiParam({ name: "id", type: String, format: "uuid" })
  @ApiOkResponse({ description: "The draft, priced again", standardSchema: BookingResponseDto.schema })
  @ApiError(400, "Invalid body or unknown service", badRequestBodySchema)
  @ApiError(404, "Booking not found (or another customer's)")
  @ApiError(
    409,
    "The slot is no longer available, step 2 was not saved, or the booking is no longer a draft",
    bookingConflictSchema("slot_unavailable", "step_not_reached", "not_editable"),
  )
  @ApiJsonBody(ServicesRequestDto.schema)
  async saveServicesOf(
    @Req() request: AuthenticatedRequest,
    @Param("id", BookingIdPipe) id: string,
    @Body(new ZodValidationPipe(ServicesRequestDto)) body: ServicesRequestDto,
  ): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.saveServices.execute(request.session.userId, id, body.serviceIds));
  }

  // Confirming creates nothing (a repeat returns the same booking), so it answers 200 rather than 201.
  @Post(":id/confirm")
  @HttpCode(200)
  @ApiOperation({ summary: "Confirm the draft (idempotent: a repeat returns the confirmed booking, D-06)" })
  @ApiParam({ name: "id", type: String, format: "uuid" })
  @ApiOkResponse({ description: "The confirmed booking", standardSchema: BookingResponseDto.schema })
  @ApiError(404, "Booking not found (or another customer's)")
  @ApiError(
    409,
    "The slot is taken or no longer available, step 2 was not saved, the booking cannot be confirmed, or the quote expired (D-18)",
    bookingConflictSchema("slot_unavailable", "slot_taken", "step_not_reached", "not_editable", "quote_expired"),
  )
  async confirm(@Req() request: AuthenticatedRequest, @Param("id", BookingIdPipe) id: string): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.confirmBooking.execute(request.session.userId, id));
  }
}
