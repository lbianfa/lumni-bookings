export interface OutgoingEmail {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
  /** Makes repeated attempts of one email a single send on the provider's side (D-09). */
  readonly idempotencyKey: string;
}

// Port (D-10): Resend when `RESEND_API_KEY` is set, a local adapter otherwise; tests replace it.
export abstract class EmailSender {
  /** Sends the email and returns the provider's message id; throws `EmailNotSentError` when it is not sent. */
  abstract send(email: OutgoingEmail): Promise<string>;
}
