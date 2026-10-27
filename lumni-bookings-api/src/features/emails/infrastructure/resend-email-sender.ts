import { Resend } from "resend";

import { EmailSender, type OutgoingEmail } from "../application/email-sender";
import { EmailNotSentError } from "../domain/exceptions";

/** Sends through Resend (D-10). With the same idempotency key and payload, Resend never sends twice (D-09). */
export class ResendEmailSender extends EmailSender {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    super();
    this.resend = new Resend(apiKey);
  }

  async send(email: OutgoingEmail): Promise<string> {
    // The SDK returns API failures as values; network failures still throw.
    const { data, error } = await this.resend.emails.send(
      { from: this.from, to: email.to, subject: email.subject, text: email.body },
      { idempotencyKey: email.idempotencyKey },
    );
    if (error) throw new EmailNotSentError(`${error.name}: ${error.message}`);
    return data.id;
  }
}
