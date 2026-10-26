import type { Transaction } from "../../../../shared/application/unit-of-work";

// Port: which additional services a booking selected; tests replace it with an in-memory fake.
export abstract class BookingServiceRepository {
  abstract findServiceIds(bookingId: string, tx?: Transaction): Promise<string[]>;
  /** The selected service ids of each booking in `bookingIds`, read in one query; a booking without services is absent. */
  abstract findServiceIdsByBookings(bookingIds: readonly string[], tx?: Transaction): Promise<Map<string, string[]>>;
  /** Replaces the booking's selected services with `serviceIds`. */
  abstract replace(bookingId: string, serviceIds: readonly string[], tx: Transaction): Promise<void>;
}
