import { Inject, Injectable } from "@nestjs/common";

import { BookingAccess } from "./helpers/booking-access";
import { BookingDetailsReader, type BookingDetails } from "./helpers/booking-details";

/** Opens one of the user's bookings, so a draft resumes at its furthest step. */
@Injectable()
export class GetBooking {
  constructor(
    @Inject(BookingAccess) private readonly access: BookingAccess,
    @Inject(BookingDetailsReader) private readonly details: BookingDetailsReader,
  ) {}

  async execute(userId: string, bookingId: string): Promise<BookingDetails> {
    const { customer, booking } = await this.access.find(userId, bookingId);
    return this.details.read(booking, customer);
  }
}
