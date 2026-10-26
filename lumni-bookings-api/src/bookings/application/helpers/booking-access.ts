import { Inject, Injectable } from "@nestjs/common";

import type { Customer } from "../../../customers/domain/entities/customer";
import { CustomerRepository } from "../../../customers/domain/repos/customer.repo";
import type { Transaction } from "../../../shared/application/unit-of-work";
import type { Booking } from "../../domain/entities/booking";
import { BookingNotFoundError, CustomerRequiredError } from "../../domain/exceptions";
import { BookingRepository } from "../../domain/repos/booking.repo";

export interface OwnedBooking {
  readonly customer: Customer;
  readonly booking: Booking;
}

// A user books as its own customer (one customer per user) and only sees that customer's bookings.
@Injectable()
export class BookingAccess {
  constructor(
    @Inject(CustomerRepository) private readonly customers: CustomerRepository,
    @Inject(BookingRepository) private readonly bookings: BookingRepository,
  ) {}

  /** The user's customer; a user without one (the admin) cannot book. */
  async customerOf(userId: string, tx?: Transaction): Promise<Customer> {
    const customer = await this.customers.findByUserId(userId, tx);
    if (!customer) throw new CustomerRequiredError();
    return customer;
  }

  /** The user's booking; another customer's booking is reported as not found. */
  async find(userId: string, bookingId: string): Promise<OwnedBooking> {
    const customer = await this.customerOf(userId);
    return { customer, booking: owned(await this.bookings.findById(bookingId), customer) };
  }

  /** Like `find`, and locks the booking row until `tx` ends. */
  async lock(userId: string, bookingId: string, tx: Transaction): Promise<OwnedBooking> {
    const customer = await this.customerOf(userId, tx);
    return { customer, booking: owned(await this.bookings.lockById(bookingId, tx), customer) };
  }
}

function owned(booking: Booking | null, customer: Customer): Booking {
  if (!booking || !booking.isOwnedBy(customer.id)) throw new BookingNotFoundError();
  return booking;
}
