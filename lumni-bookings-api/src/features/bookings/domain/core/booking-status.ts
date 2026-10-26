import { InvalidStatusTransitionError } from "../exceptions";

export type BookingStatus = "draft" | "confirmed" | "completed" | "cancelled";

// The guide's transition table (CONTEXT §1.2): any transition missing here is rejected.
const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  draft: ["confirmed"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) throw new InvalidStatusTransitionError(from, to);
}
