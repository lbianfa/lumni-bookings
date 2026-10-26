import type { Transaction } from "../../../../shared/application/unit-of-work";
import type { BookingStatus } from "../core/booking-status";
import type { Booking, NewBooking } from "../entities/booking";

/** Narrows the admin's booking list; an absent field does not filter. */
export interface BookingFilter {
  readonly status?: BookingStatus;
  readonly roomId?: string;
}

export interface BookedInterval {
  readonly startsAt: Date;
  readonly endsAt: Date;
}

// Port: availability reads the room's blocking bookings, the booking flow stores drafts, and My bookings and the
// admin list them; tests replace it with an in-memory fake.
export abstract class BookingRepository {
  /** Bookings of the room that block a slot (`confirmed` or `completed`, D-04) and overlap [from, to). */
  abstract findBlockingIntervals(roomId: string, from: Date, to: Date, tx?: Transaction): Promise<BookedInterval[]>;
  abstract create(booking: NewBooking, tx: Transaction): Promise<Booking>;
  abstract findById(id: string, tx?: Transaction): Promise<Booking | null>;
  /** Every booking of the customer, in any status, newest created first. */
  abstract findByCustomer(customerId: string, tx?: Transaction): Promise<Booking[]>;
  /** A page of every customer's bookings matching `filter`, newest created first. */
  abstract findPage(filter: BookingFilter, offset: number, limit: number, tx?: Transaction): Promise<Booking[]>;
  /** How many bookings match `filter`. */
  abstract count(filter: BookingFilter, tx?: Transaction): Promise<number>;
  /** Reads the booking and locks its row until `tx` ends, so writes to the same booking serialize. */
  abstract lockById(id: string, tx: Transaction): Promise<Booking | null>;
  /**
   * Writes the booking over its stored draft with a conditional update `WHERE status = 'draft'` (D-06);
   * returns `false` when the stored row is no longer a draft. Throws `SlotTakenError` when confirming
   * it overlaps another blocking booking of the room (exclusion constraint, D-05).
   */
  abstract save(booking: Booking, tx: Transaction): Promise<boolean>;
}
