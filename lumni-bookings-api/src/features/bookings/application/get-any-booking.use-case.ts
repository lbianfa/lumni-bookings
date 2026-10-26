import { Inject, Injectable } from "@nestjs/common";

import { CustomerRepository } from "../../customers/domain/repos/customer.repo";
import { BookingNotFoundError } from "../domain/exceptions";
import { BookingRepository } from "../domain/repos/booking.repo";
import { BookingDetailsReader, type BookingDetails } from "./helpers/booking-details";

/** Opens any customer's booking for the admin, with the same details the customer reads. */
@Injectable()
export class GetAnyBooking {
  constructor(
    @Inject(BookingRepository) private readonly bookings: BookingRepository,
    @Inject(CustomerRepository) private readonly customers: CustomerRepository,
    @Inject(BookingDetailsReader) private readonly details: BookingDetailsReader,
  ) {}

  async execute(bookingId: string): Promise<BookingDetails> {
    const booking = await this.bookings.findById(bookingId);
    if (!booking) throw new BookingNotFoundError();
    // Bookings reference their customer with a restricting foreign key, so it always exists.
    const customer = await this.customers.findById(booking.customerId);
    if (!customer) throw new Error(`Customer of booking ${booking.id} not found`);
    return this.details.read(booking, customer);
  }
}
