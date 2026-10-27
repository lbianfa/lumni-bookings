import { Inject, Injectable } from "@nestjs/common";

import { Clock } from "../../../shared/domain/clock";
import { OutboxEmailRepository } from "../domain/repos/outbox-email.repo";
import { EmailSender } from "./email-sender";

/** Sends a pending outbox email once, with its stored payload (D-09), and records the outcome on its row. */
@Injectable()
export class SendOutboxEmail {
  constructor(
    @Inject(OutboxEmailRepository) private readonly outbox: OutboxEmailRepository,
    @Inject(EmailSender) private readonly sender: EmailSender,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  async execute(emailId: string): Promise<void> {
    const email = await this.outbox.findById(emailId);
    // Only a pending email is sent: a failed one stays failed until retries exist.
    if (!email || email.status !== "pending") return;

    try {
      const messageId = await this.sender.send({
        to: email.toAddress,
        subject: email.subject,
        body: email.body,
        idempotencyKey: email.idempotencyKey,
      });
      email.markSent(messageId, this.clock.now());
    } catch (error) {
      email.markFailed(error instanceof Error ? error.message : String(error));
    }
    await this.outbox.save(email);
  }
}
