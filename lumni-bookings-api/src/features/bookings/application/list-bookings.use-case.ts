import { Inject, Injectable } from "@nestjs/common";

import type { Customer } from "../../customers/domain/entities/customer";
import { CustomerRepository } from "../../customers/domain/repos/customer.repo";
import { BookingRepository, type BookingFilter } from "../domain/repos/booking.repo";
import { BookingSummaries, type BookingSummary } from "./helpers/booking-summaries";

/** Bookings per page of the admin list. */
export const BOOKINGS_PAGE_SIZE = 10;

/** One item of the admin list: a booking summary and whose booking it is. */
export interface CustomerBookingSummary extends BookingSummary {
  readonly customer: Customer;
}

export interface BookingPage {
  readonly items: readonly CustomerBookingSummary[];
  /** From 1; a page past the last one has no items. */
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  /** At least 1, so an empty list still reads "Page 1 of 1". */
  readonly totalPages: number;
}

/** Lists every customer's bookings for the admin (CONTEXT §1.3), newest created first, one page at a time. */
@Injectable()
export class ListBookings {
  constructor(
    @Inject(BookingRepository) private readonly bookings: BookingRepository,
    @Inject(CustomerRepository) private readonly customers: CustomerRepository,
    @Inject(BookingSummaries) private readonly summaries: BookingSummaries,
  ) {}

  async execute(filter: BookingFilter, page: number): Promise<BookingPage> {
    const [total, bookings] = await Promise.all([
      this.bookings.count(filter),
      this.bookings.findPage(filter, (page - 1) * BOOKINGS_PAGE_SIZE, BOOKINGS_PAGE_SIZE),
    ]);
    const [summaries, customers] = await Promise.all([
      this.summaries.of(bookings),
      this.customers.findByIds([...new Set(bookings.map((booking) => booking.customerId))]),
    ]);
    const customersById = new Map(customers.map((customer) => [customer.id, customer]));

    return {
      items: summaries.map((summary) => {
        // Bookings reference their customer with a restricting foreign key, so it always exists.
        const customer = customersById.get(summary.booking.customerId);
        if (!customer) throw new Error(`Customer of booking ${summary.booking.id} not found`);
        return { ...summary, customer };
      }),
      page,
      pageSize: BOOKINGS_PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / BOOKINGS_PAGE_SIZE)),
    };
  }
}
