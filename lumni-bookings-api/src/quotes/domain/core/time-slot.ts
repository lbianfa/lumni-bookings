import { toInstant } from "./business-time";
import { InvalidTimeSlotError } from "../exceptions";

// Booking grid and duration limits (CONTEXT §1.1).
export const SLOT_MINUTES = 30;
export const MIN_DURATION_MINUTES = 60;
export const MAX_DURATION_MINUTES = 600;

/** A requested booking interval on one business date, half-open: [start, end). */
export class TimeSlot {
  private constructor(
    readonly date: string,
    readonly startMinute: number,
    readonly durationMinutes: number,
  ) {}

  static create(date: string, startMinute: number, durationMinutes: number): TimeSlot {
    if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute >= 24 * 60 || startMinute % SLOT_MINUTES !== 0) {
      throw new InvalidTimeSlotError("The start time must be on the hour or at half past.");
    }
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < MIN_DURATION_MINUTES ||
      durationMinutes > MAX_DURATION_MINUTES ||
      durationMinutes % SLOT_MINUTES !== 0
    ) {
      throw new InvalidTimeSlotError("The duration must be 1 to 10 hours, in 30-minute blocks.");
    }
    return new TimeSlot(date, startMinute, durationMinutes);
  }

  get endMinute(): number {
    return this.startMinute + this.durationMinutes;
  }

  get startsAt(): Date {
    return toInstant(this.date, this.startMinute);
  }

  get endsAt(): Date {
    return toInstant(this.date, this.endMinute);
  }

  withStart(startMinute: number): TimeSlot {
    return TimeSlot.create(this.date, startMinute, this.durationMinutes);
  }
}
