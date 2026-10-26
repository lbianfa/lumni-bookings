import { Controller, Get, Inject, Param, Req, UseFilters, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";

import { SessionGuard, type AuthenticatedRequest } from "../../../auth/http/session.guard";
import { ApiError } from "../../../shared/http/openapi";
import { GetBooking } from "../application/get-booking.use-case";
import { ListMyBookings } from "../application/list-my-bookings.use-case";
import { BookingIdPipe } from "./booking-id.pipe";
import { BookingsExceptionFilter } from "./bookings-exception.filter";
import { BookingListItemDto } from "./dtos/booking-list-item.dto";
import { BookingResponseDto } from "./dtos/booking-response.dto";

// Reads of the session customer's bookings (My bookings); the booking flow's writes stay under /api/bookings.
@Controller("my-bookings")
@UseGuards(SessionGuard)
@UseFilters(BookingsExceptionFilter)
@ApiTags("bookings")
@ApiCookieAuth()
@ApiError(401, "No valid session cookie")
@ApiError(403, "The user has no customer (the admin cannot book)")
export class MyBookingsController {
  constructor(
    @Inject(ListMyBookings) private readonly listMyBookings: ListMyBookings,
    @Inject(GetBooking) private readonly getBooking: GetBooking,
  ) {}

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
}
