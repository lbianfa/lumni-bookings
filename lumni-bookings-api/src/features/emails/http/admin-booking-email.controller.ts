import { Controller, Get, Inject, Param, UseFilters, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";

import { AdminGuard } from "../../../auth/http/admin.guard";
import { SessionGuard } from "../../../auth/http/session.guard";
import { ApiError } from "../../../shared/http/openapi";
import { BookingIdPipe } from "../../bookings/http/booking-id.pipe";
import { GetBookingEmail } from "../application/get-booking-email.use-case";
import { BookingEmailResponseDto } from "./dtos/booking-email-response.dto";
import { EmailsExceptionFilter } from "./emails-exception.filter";

// The admin's view of a booking's confirmation email; it shares the admin's /api/bookings path.
@Controller("bookings")
@UseGuards(SessionGuard, AdminGuard)
@UseFilters(EmailsExceptionFilter)
@ApiTags("admin")
@ApiCookieAuth()
@ApiError(401, "No valid session cookie")
@ApiError(403, "The user is not an admin")
export class AdminBookingEmailController {
  constructor(@Inject(GetBookingEmail) private readonly getBookingEmail: GetBookingEmail) {}

  @Get(":id/email")
  @ApiOperation({ summary: "Read a booking's confirmation email and its send attempts" })
  @ApiParam({ name: "id", type: String, format: "uuid" })
  @ApiOkResponse({ description: "The confirmation email", standardSchema: BookingEmailResponseDto.schema })
  @ApiError(404, "The booking has no confirmation email, or does not exist")
  async get(@Param("id", BookingIdPipe) id: string): Promise<BookingEmailResponseDto> {
    return BookingEmailResponseDto.from(await this.getBookingEmail.execute(id));
  }
}
