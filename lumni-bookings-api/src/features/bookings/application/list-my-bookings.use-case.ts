import { Inject, Injectable } from "@nestjs/common";

import { BookingRepository } from "../domain/repos/booking.repo";
import { BookingAccess } from "./helpers/booking-access";
import { BookingSummaries, type BookingSummary } from "./helpers/booking-summaries";

/** Lists every booking of the user's customer, newest created first, in any status (My bookings). */
@Injectable()
export class ListMyBookings {
  constructor(
    @Inject(BookingAccess) private readonly access: BookingAccess,
    @Inject(BookingRepository) private readonly bookings: BookingRepository,
    @Inject(BookingSummaries) private readonly summaries: BookingSummaries,
  ) {}

  async execute(userId: string): Promise<BookingSummary[]> {
    const customer = await this.access.customerOf(userId);
    return this.summaries.of(await this.bookings.findByCustomer(customer.id));
  }
}
