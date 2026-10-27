import { z } from "zod";

import type { BookingEmail } from "../../application/get-booking-email.use-case";
import type { EmailAttemptOutcome } from "../../domain/entities/email-attempt";
import type { EmailStatus, EmailType } from "../../domain/entities/outbox-email";

const emailAttemptSchema = z.object({
  attemptedAt: z.iso.datetime(),
  outcome: z.enum(["sent", "failed"]),
  error: z.string().nullable().describe("Why the provider did not take it; null when sent"),
});

const bookingEmailSchema = z.object({
  type: z.enum(["booking_confirmation"]),
  status: z.enum(["pending", "sent", "failed"]),
  toAddress: z.string(),
  subject: z.string(),
  attemptCount: z.int().describe("Attempts made; emails queued before the history was kept have none listed"),
  lastError: z.string().nullable(),
  sentAt: z.iso.datetime().nullable(),
  attempts: z.array(emailAttemptSchema).describe("Every recorded send attempt, oldest first"),
});

// A booking's confirmation email for the admin; `schema` documents it (the class must keep matching it).
export class BookingEmailResponseDto implements z.infer<typeof bookingEmailSchema> {
  static readonly schema = bookingEmailSchema;

  readonly type: EmailType;
  readonly status: EmailStatus;
  readonly toAddress: string;
  readonly subject: string;
  readonly attemptCount: number;
  readonly lastError: string | null;
  readonly sentAt: string | null;
  readonly attempts: { attemptedAt: string; outcome: EmailAttemptOutcome; error: string | null }[];

  private constructor({ email, attempts }: BookingEmail) {
    this.type = email.type;
    this.status = email.status;
    this.toAddress = email.toAddress;
    this.subject = email.subject;
    this.attemptCount = email.attempts;
    this.lastError = email.lastError;
    this.sentAt = email.sentAt?.toISOString() ?? null;
    this.attempts = attempts.map((attempt) => ({
      attemptedAt: attempt.attemptedAt.toISOString(),
      outcome: attempt.outcome,
      error: attempt.error,
    }));
  }

  static from(bookingEmail: BookingEmail): BookingEmailResponseDto {
    return new BookingEmailResponseDto(bookingEmail);
  }
}
