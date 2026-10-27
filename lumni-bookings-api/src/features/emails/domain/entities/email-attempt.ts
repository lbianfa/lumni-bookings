export type EmailAttemptOutcome = "sent" | "failed";

/** One send attempt of an outbox email, kept for the admin's attempt history. */
export interface EmailAttempt {
  readonly attemptedAt: Date;
  readonly outcome: EmailAttemptOutcome;
  /** Why the provider did not take it; null when it was sent. */
  readonly error: string | null;
  readonly providerMessageId: string | null;
}
