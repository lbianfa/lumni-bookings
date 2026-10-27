import type { Transaction } from "../../../../shared/application/unit-of-work";
import type { NewOutboxEmail, OutboxEmail } from "../entities/outbox-email";

// Port: the email outbox (D-07); tests replace it with an in-memory fake.
export abstract class OutboxEmailRepository {
  /** Queues the email in the caller's transaction and returns its id. One email per booking and type. */
  abstract add(email: NewOutboxEmail, tx: Transaction): Promise<string>;
  abstract findById(id: string, tx?: Transaction): Promise<OutboxEmail | null>;
  /** Stores the outcome of a send attempt. */
  abstract save(email: OutboxEmail, tx?: Transaction): Promise<void>;
}
