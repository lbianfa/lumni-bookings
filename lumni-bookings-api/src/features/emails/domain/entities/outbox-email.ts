import type { EmailAttempt } from "./email-attempt";

export type EmailType = "booking_confirmation";
export type EmailStatus = "pending" | "sent" | "failed";

// Idempotency key prefix per type (D-09): every attempt of an email is the same request to the provider.
const KEY_PREFIXES: Record<EmailType, string> = { booking_confirmation: "booking-confirmation" };

export interface OutboxEmailState {
  readonly id: string;
  readonly bookingId: string;
  readonly type: EmailType;
  /** The rendered email, stored once when it is queued (D-09). */
  readonly toAddress: string;
  readonly subject: string;
  readonly body: string;
  readonly status: EmailStatus;
  readonly attempts: number;
  readonly lastError: string | null;
  readonly providerMessageId: string | null;
  readonly sentAt: Date | null;
}

/** An email to queue: pending, never attempted. */
export type NewOutboxEmail = Pick<OutboxEmailState, "bookingId" | "type" | "toAddress" | "subject" | "body">;

/** One row of the transactional outbox (D-07). */
export class OutboxEmail {
  private constructor(private state: OutboxEmailState) {}

  static restore(state: OutboxEmailState): OutboxEmail {
    return new OutboxEmail(state);
  }

  get id(): string {
    return this.state.id;
  }
  get bookingId(): string {
    return this.state.bookingId;
  }
  get type(): EmailType {
    return this.state.type;
  }
  get toAddress(): string {
    return this.state.toAddress;
  }
  get subject(): string {
    return this.state.subject;
  }
  get body(): string {
    return this.state.body;
  }
  get status(): EmailStatus {
    return this.state.status;
  }
  get attempts(): number {
    return this.state.attempts;
  }
  get lastError(): string | null {
    return this.state.lastError;
  }
  get providerMessageId(): string | null {
    return this.state.providerMessageId;
  }
  get sentAt(): Date | null {
    return this.state.sentAt;
  }

  /** `booking-confirmation/<booking id>` (D-09). */
  get idempotencyKey(): string {
    return `${KEY_PREFIXES[this.state.type]}/${this.state.bookingId}`;
  }

  /** Records an attempt the provider accepted and returns it for the attempt history. */
  markSent(providerMessageId: string, now: Date): EmailAttempt {
    this.state = {
      ...this.state,
      status: "sent",
      attempts: this.state.attempts + 1,
      lastError: null,
      providerMessageId,
      sentAt: now,
    };
    return { attemptedAt: now, outcome: "sent", error: null, providerMessageId };
  }

  /** Records an attempt that failed (nothing retries it yet) and returns it for the attempt history. */
  markFailed(error: string, now: Date): EmailAttempt {
    this.state = { ...this.state, status: "failed", attempts: this.state.attempts + 1, lastError: error };
    return { attemptedAt: now, outcome: "failed", error, providerMessageId: null };
  }
}
