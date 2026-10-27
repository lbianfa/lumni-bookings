// Port: starts the in-process job that sends a queued outbox email; tests replace it.
export abstract class EmailJobs {
  /** Call only after the transaction that queued the email committed; returns without waiting for the send. */
  abstract enqueue(emailId: string): void;
}
