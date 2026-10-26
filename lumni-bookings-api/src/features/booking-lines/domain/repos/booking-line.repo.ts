import type { Transaction } from "../../../../shared/application/unit-of-work";
import type { BookingLine } from "../entities/booking-line";

// Port: the price breakdown snapshot of a booking; tests replace it with an in-memory fake.
export abstract class BookingLineRepository {
  /** The booking's lines, in the order they were written. */
  abstract findByBooking(bookingId: string, tx?: Transaction): Promise<BookingLine[]>;
  /** Replaces every line of the booking with `lines`. */
  abstract replace(bookingId: string, lines: readonly BookingLine[], tx: Transaction): Promise<void>;
}
