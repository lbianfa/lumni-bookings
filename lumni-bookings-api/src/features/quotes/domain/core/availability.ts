import { SUNDAY, dayOfWeek, minutesSinceStartOf } from "./business-time";
import type { BookedInterval } from "../../../bookings/domain/repos/booking.repo";
import { SLOT_MINUTES, type TimeSlot } from "./time-slot";

// Opening hours, Monday to Saturday (CONTEXT §1.1): the whole booking fits inside them.
export const OPENING_MINUTE = 7 * 60;
export const CLOSING_MINUTE = 21 * 60;

export type Unavailability =
  | { readonly code: "closed_day" }
  | { readonly code: "outside_opening_hours" }
  | { readonly code: "in_the_past" }
  | { readonly code: "room_booked"; readonly conflict: { readonly startMinute: number; readonly endMinute: number } };

export interface Availability {
  /** Why the slot cannot be booked, or `null` when it can. */
  readonly unavailability: Unavailability | null;
  /** The next free slot on the same day, after the requested start; only when the requested one is not free. */
  readonly suggestion: TimeSlot | null;
}

// Intervals are half-open: a booking ending at 10:00 does not overlap one starting at 10:00.
function findConflict(slot: TimeSlot, booked: readonly BookedInterval[]): BookedInterval | undefined {
  return booked.find(({ startsAt, endsAt }) => slot.startsAt < endsAt && startsAt < slot.endsAt);
}

function check(slot: TimeSlot, now: Date, booked: readonly BookedInterval[]): Unavailability | null {
  if (dayOfWeek(slot.date) === SUNDAY) return { code: "closed_day" };
  if (slot.startMinute < OPENING_MINUTE || slot.endMinute > CLOSING_MINUTE) return { code: "outside_opening_hours" };
  // Quoting a slot that has already started is not possible (D-21).
  if (slot.startsAt < now) return { code: "in_the_past" };

  const conflict = findConflict(slot, booked);
  if (!conflict) return null;
  return {
    code: "room_booked",
    conflict: {
      startMinute: minutesSinceStartOf(slot.date, conflict.startsAt),
      endMinute: minutesSinceStartOf(slot.date, conflict.endsAt),
    },
  };
}

/**
 * Checks a slot against the opening hours, the current time and the room's blocking bookings of that day.
 * `booked` must hold every blocking booking of the room that overlaps the slot's date.
 */
export function checkAvailability(slot: TimeSlot, now: Date, booked: readonly BookedInterval[]): Availability {
  const unavailability = check(slot, now, booked);
  if (!unavailability || unavailability.code === "closed_day") return { unavailability, suggestion: null };

  for (let start = Math.max(OPENING_MINUTE, slot.startMinute + SLOT_MINUTES); start < 24 * 60; start += SLOT_MINUTES) {
    const candidate = slot.withStart(start);
    if (candidate.endMinute > CLOSING_MINUTE) break;
    if (check(candidate, now, booked) === null) return { unavailability, suggestion: candidate };
  }
  return { unavailability, suggestion: null };
}
