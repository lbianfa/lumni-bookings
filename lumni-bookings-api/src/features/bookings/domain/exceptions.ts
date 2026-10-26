import type { Unavailability } from "../../quotes/domain/core/availability";
import type { TimeSlot } from "../../quotes/domain/core/time-slot";
import type { Room } from "../../rooms/domain/entities/room";
import { DomainError } from "../../../shared/domain/domain-error";
import type { BookingStatus } from "./core/booking-status";

export class BookingNotFoundError extends DomainError {
  constructor() {
    super("Booking not found");
  }
}

/** The signed-in user has no customer (the admin), so it cannot book. */
export class CustomerRequiredError extends DomainError {
  constructor() {
    super("Only customers can make bookings.");
  }
}

export class InvalidStatusTransitionError extends DomainError {
  constructor(
    readonly from: BookingStatus,
    readonly to: BookingStatus,
  ) {
    super(`A ${from} booking cannot become ${to}.`);
  }
}

/** Only drafts can be edited. */
export class BookingNotEditableError extends DomainError {
  constructor() {
    super("Only draft bookings can be changed.");
  }
}

export class StepNotReachedError extends DomainError {
  constructor(step: number) {
    super(`Complete the previous steps before step ${step}.`);
  }
}

/** The requested or current slot fails the quote rules (§1.1, D-21). */
export class SlotUnavailableError extends DomainError {
  constructor(
    readonly reason: Unavailability,
    readonly slot: TimeSlot,
    readonly room: Room,
  ) {
    super("The slot is not available.");
  }
}

/** Another confirmed booking won the slot (exclusion constraint, D-05). */
export class SlotTakenError extends DomainError {
  constructor() {
    super("Another booking was just confirmed for this room and time. Pick another slot.");
  }
}

export class UnknownServiceError extends DomainError {
  constructor() {
    super("One or more selected services do not exist.");
  }
}

/** The price changed and the quote is two weeks old or more (D-18). */
export class QuoteExpiredError extends DomainError {
  constructor() {
    super("Prices changed since this booking was quoted and the quote has expired. Save the schedule again to get a new quote.");
  }
}
