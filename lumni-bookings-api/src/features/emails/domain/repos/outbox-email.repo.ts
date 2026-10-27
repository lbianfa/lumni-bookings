import type { Transaction } from "../../../../shared/application/unit-of-work";
import type { EmailAttempt } from "../entities/email-attempt";
import type { EmailType, NewOutboxEmail, OutboxEmail } from "../entities/outbox-email";

// Port: the email outbox (D-07) and its attempt history; tests replace it with an in-memory fake.
export abstract class OutboxEmailRepository {
  /** Queues the email in the caller's transaction and returns its id. One email per booking and type. */
  abstract add(email: NewOutboxEmail, tx: Transaction): Promise<string>;
  abstract findById(id: string, tx?: Transaction): Promise<OutboxEmail | null>;
  abstract findByBooking(bookingId: string, type: EmailType, tx?: Transaction): Promise<OutboxEmail | null>;
  /** Stores the outcome of a send attempt. */
  abstract save(email: OutboxEmail, tx: Transaction): Promise<void>;
  abstract addAttempt(emailId: string, attempt: EmailAttempt, tx: Transaction): Promise<void>;
  /** The email's attempts, oldest first. */
  abstract findAttempts(emailId: string, tx?: Transaction): Promise<EmailAttempt[]>;
}
