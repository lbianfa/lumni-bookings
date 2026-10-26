import { Controller, Get, Inject, Param, Query, UseFilters, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";

import { AdminGuard } from "../../../auth/http/admin.guard";
import { SessionGuard } from "../../../auth/http/session.guard";
import { ApiError, badRequestBodySchema } from "../../../shared/http/openapi";
import { ZodValidationPipe } from "../../../shared/http/zod-validation.pipe";
import { GetAnyBooking } from "../application/get-any-booking.use-case";
import { BOOKINGS_PAGE_SIZE, ListBookings } from "../application/list-bookings.use-case";
import { BookingIdPipe } from "./booking-id.pipe";
import { BookingsExceptionFilter } from "./bookings-exception.filter";
import { BookingPageDto } from "./dtos/booking-page.dto";
import { BookingResponseDto } from "./dtos/booking-response.dto";
import { BookingsQueryDto } from "./dtos/bookings-query.dto";

// The admin's reads of every customer's bookings (CONTEXT §1.3); the booking flow's writes share the /api/bookings path.
@Controller("bookings")
@UseGuards(SessionGuard, AdminGuard)
@UseFilters(BookingsExceptionFilter)
@ApiTags("admin")
@ApiCookieAuth()
@ApiError(401, "No valid session cookie")
@ApiError(403, "The user is not an admin")
export class AdminBookingsController {
  constructor(
    @Inject(ListBookings) private readonly listBookings: ListBookings,
    @Inject(GetAnyBooking) private readonly getAnyBooking: GetAnyBooking,
  ) {}

  @Get()
  @ApiOperation({ summary: `List every customer's bookings, newest created first, ${BOOKINGS_PAGE_SIZE} per page` })
  @ApiQuery({ name: "status", required: false, enum: ["draft", "confirmed", "completed", "cancelled"] })
  @ApiQuery({ name: "roomId", required: false, type: String, format: "uuid" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "From 1 (default 1)" })
  @ApiOkResponse({ description: "One page of bookings", standardSchema: BookingPageDto.schema })
  @ApiError(400, "Invalid query string", badRequestBodySchema)
  async list(
    @Query(new ZodValidationPipe(BookingsQueryDto, "Invalid query string")) query: BookingsQueryDto,
  ): Promise<BookingPageDto> {
    return BookingPageDto.from(await this.listBookings.execute(query.filter, query.page));
  }

  @Get(":id")
  @ApiOperation({ summary: "Read any customer's booking" })
  @ApiParam({ name: "id", type: String, format: "uuid" })
  @ApiOkResponse({ description: "The booking", standardSchema: BookingResponseDto.schema })
  @ApiError(404, "Booking not found")
  async get(@Param("id", BookingIdPipe) id: string): Promise<BookingResponseDto> {
    return BookingResponseDto.from(await this.getAnyBooking.execute(id));
  }
}
