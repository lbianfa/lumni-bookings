export interface BookedInterval {
  readonly startsAt: Date;
  readonly endsAt: Date;
}

// Port: availability reads the room's blocking bookings; tests replace it with an in-memory fake.
export abstract class BookingRepository {
  /** Bookings of the room that block a slot (`confirmed` or `completed`, D-04) and overlap [from, to). */
  abstract findBlockingIntervals(roomId: string, from: Date, to: Date): Promise<BookedInterval[]>;
}
