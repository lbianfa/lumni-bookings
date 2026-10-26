import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, Req, UseFilters, UseGuards } from "@nestjs/common";

import { SessionGuard, type AuthenticatedRequest } from "../../auth/http/session.guard";
import { QuoteRequestDto } from "../../quotes/http/dtos/quote-request.dto";
import { ZodValidationPipe } from "../../shared/http/zod-validation.pipe";
import { ConfirmBooking } from "../application/confirm-booking.use-case";
import { GetBooking } from "../application/get-booking.use-case";
import { SaveCustomerDetails } from "../application/save-customer-details.use-case";
import { SaveSchedule } from "../application/save-schedule.use-case";
import { SaveServices } from "../application/save-services.use-case";
import { StartBooking } from "../application/start-booking.use-case";
import { BookingIdPipe } from "./booking-id.pipe";
import { BookingsExceptionFilter } from "./bookings-exception.filter";
import { BookingResponseDto } from "./dtos/booking-response.dto";
import { CustomerDetailsRequestDto } from "./dtos/customer-details-request.dto";
import { ServicesRequestDto } from "./dtos/services-request.dto";

// The 3-step booking flow (CONTEXT §1.2); a customer only reaches their own bookings.
@Controller("bookings")
@UseGuards(SessionGuard)
@UseFilters(BookingsExceptionFilter)
export class BookingsController {
  constructor(
    @Inject(StartBooking) private readonly startBooking: StartBooking,
    @Inject(GetBooking) private readonly getBooking: GetBooking,
    @Inject(SaveCustomerDetails) private readonly saveCustomerDetails: SaveCustomerDetails,
    @Inject(SaveSchedule) private readonly saveSchedule: SaveSchedule,
    @Inject(SaveServices) private readonly saveServices: SaveServices,
    @Inject(ConfirmBooking) private readonly confirmBooking: ConfirmBooking,
  ) {}

  // The schedule shares the quote's request shape: the draft starts from the quoted slot.
  @Post()
  async start(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(QuoteRequestDto)) body: QuoteRequestDto,
  ): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.startBooking.execute(request.session.userId, body));
  }

  @Get(":id")
  async get(@Req() request: AuthenticatedRequest, @Param("id", BookingIdPipe) id: string): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.getBooking.execute(request.session.userId, id));
  }

  @Put(":id/customer")
  async saveCustomer(
    @Req() request: AuthenticatedRequest,
    @Param("id", BookingIdPipe) id: string,
    @Body(new ZodValidationPipe(CustomerDetailsRequestDto)) body: CustomerDetailsRequestDto,
  ): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.saveCustomerDetails.execute(request.session.userId, id, body));
  }

  @Put(":id/schedule")
  async saveScheduleOf(
    @Req() request: AuthenticatedRequest,
    @Param("id", BookingIdPipe) id: string,
    @Body(new ZodValidationPipe(QuoteRequestDto)) body: QuoteRequestDto,
  ): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.saveSchedule.execute(request.session.userId, id, body));
  }

  @Put(":id/services")
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
  async confirm(@Req() request: AuthenticatedRequest, @Param("id", BookingIdPipe) id: string): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.confirmBooking.execute(request.session.userId, id));
  }
}
