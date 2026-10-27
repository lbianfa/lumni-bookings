import { randomUUID } from "node:crypto";

import { Logger } from "@nestjs/common";

import { EmailSender, type OutgoingEmail } from "../application/email-sender";

/** Without `RESEND_API_KEY` (D-10): nothing leaves the machine; the outbox row keeps the email and is marked sent. */
export class LocalEmailSender extends EmailSender {
  private readonly logger = new Logger(LocalEmailSender.name);

  send(email: OutgoingEmail): Promise<string> {
    this.logger.log(`Email not sent (no RESEND_API_KEY): "${email.subject}" to ${email.to}`);
    return Promise.resolve(`local-${randomUUID()}`);
  }
}
