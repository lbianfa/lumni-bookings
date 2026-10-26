import { businessDateOf, minutesSinceStartOf } from "../../../quotes/domain/core/business-time";
import { TimeSlot } from "../../../quotes/domain/core/time-slot";
import { assertTransition, type BookingStatus } from "../core/booking-status";
import { BookingNotEditableError, StepNotReachedError } from "../exceptions";

// The 3-step form (CONTEXT §1.2): 1 customer details, 2 room and schedule, 3 additional services.
export type BookingStep = 1 | 2 | 3;
export const FIRST_STEP: BookingStep = 1;
export const LAST_STEP: BookingStep = 3;

const MINUTE_MS = 60 * 1000;

export interface BookingState {
  readonly id: string;
  readonly customerId: string;
  readonly roomId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly status: BookingStatus;
  /** The quoted total in COP cents (D-18); frozen once confirmed (D-06). */
  readonly totalCents: number;
  readonly quotedAt: Date;
  /** Furthest step reached, where a reopened draft resumes. */
  readonly currentStep: BookingStep;
  readonly confirmedAt: Date | null;
}

/** A booking not stored yet: always a draft at the first step. */
export type NewBooking = Omit<BookingState, "id">;

export class Booking {
  private constructor(private state: BookingState) {}

  static restore(state: BookingState): Booking {
    return new Booking(state);
  }

  /** "Start booking": a draft of an available quoted slot, priced at `totalCents` and quoted `now`. */
  static startDraft(customerId: string, roomId: string, slot: TimeSlot, totalCents: number, now: Date): NewBooking {
    return {
      customerId,
      roomId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      status: "draft",
      totalCents,
      quotedAt: now,
      currentStep: FIRST_STEP,
      confirmedAt: null,
    };
  }

  get id(): string {
    return this.state.id;
  }
  get customerId(): string {
    return this.state.customerId;
  }
  get roomId(): string {
    return this.state.roomId;
  }
  get startsAt(): Date {
    return this.state.startsAt;
  }
  get endsAt(): Date {
    return this.state.endsAt;
  }
  get status(): BookingStatus {
    return this.state.status;
  }
  get totalCents(): number {
    return this.state.totalCents;
  }
  get quotedAt(): Date {
    return this.state.quotedAt;
  }
  get currentStep(): BookingStep {
    return this.state.currentStep;
  }
  get confirmedAt(): Date | null {
    return this.state.confirmedAt;
  }

  /** The booked interval as a slot on its business date. */
  get slot(): TimeSlot {
    const date = businessDateOf(this.state.startsAt);
    const durationMinutes = (this.state.endsAt.getTime() - this.state.startsAt.getTime()) / MINUTE_MS;
    return TimeSlot.create(date, minutesSinceStartOf(date, this.state.startsAt), durationMinutes);
  }

  isOwnedBy(customerId: string): boolean {
    return this.state.customerId === customerId;
  }

  /** Checks that `step` can be saved: only drafts are editable, and only up to the furthest step reached. */
  assertCanSave(step: BookingStep): void {
    if (this.state.status !== "draft") throw new BookingNotEditableError();
    if (step > this.state.currentStep) throw new StepNotReachedError(step);
  }

  /** Records that `step` was saved: the draft advances to the next step, never back. */
  completeStep(step: BookingStep): void {
    this.assertCanSave(step);
    const next = Math.min(step + 1, LAST_STEP) as BookingStep;
    if (next > this.state.currentStep) this.state = { ...this.state, currentStep: next };
  }

  /** Moves the draft to another room or slot; the caller reprices it right after. */
  reschedule(roomId: string, slot: TimeSlot): void {
    this.assertCanSave(2);
    this.state = { ...this.state, roomId, startsAt: slot.startsAt, endsAt: slot.endsAt };
  }

  /** Stores a new quote of the draft (D-18): its total and when it was quoted. */
  requote(totalCents: number, now: Date): void {
    if (this.state.status !== "draft") throw new BookingNotEditableError();
    this.state = { ...this.state, totalCents, quotedAt: now };
  }

  /** Checks `draft → confirmed` (state machine) and that every step was reached. */
  assertCanConfirm(): void {
    assertTransition(this.state.status, "confirmed");
    if (this.state.currentStep < LAST_STEP) throw new StepNotReachedError(LAST_STEP);
  }

  /** Confirms the draft at its quoted total; the price is never recalculated afterwards (D-06). */
  confirm(now: Date): void {
    this.assertCanConfirm();
    this.state = { ...this.state, status: "confirmed", confirmedAt: now };
  }
}
