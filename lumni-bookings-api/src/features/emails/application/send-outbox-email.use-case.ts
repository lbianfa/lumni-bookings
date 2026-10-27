import { Inject, Injectable } from "@nestjs/common";

import { UnitOfWork } from "../../../shared/application/unit-of-work";
import { Clock } from "../../../shared/domain/clock";
import type { EmailAttempt } from "../domain/entities/email-attempt";
import { OutboxEmailRepository } from "../domain/repos/outbox-email.repo";
import { EmailSender } from "./email-sender";

/** Sends a pending outbox email once, with its stored payload (D-09), and records the outcome and the attempt. */
@Injectable()
export class SendOutboxEmail {
  constructor(
    @Inject(OutboxEmailRepository) private readonly outbox: OutboxEmailRepository,
    @Inject(EmailSender) private readonly sender: EmailSender,
    @Inject(UnitOfWork) private readonly unitOfWork: UnitOfWork,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  async execute(emailId: string): Promise<void> {
    const email = await this.outbox.findById(emailId);
    // Only a pending email is sent: a failed one stays failed until retries exist.
    if (!email || email.status !== "pending") return;

    let attempt: EmailAttempt;
    try {
      const messageId = await this.sender.send({
        to: email.toAddress,
        subject: email.subject,
        body: email.body,
        idempotencyKey: email.idempotencyKey,
      });
      attempt = email.markSent(messageId, this.clock.now());
    } catch (error) {
      attempt = email.markFailed(error instanceof Error ? error.message : String(error), this.clock.now());
    }

    // Together, so the attempt count on the row always matches the attempt history.
    await this.unitOfWork.run(async (tx) => {
      await this.outbox.save(email, tx);
      await this.outbox.addAttempt(email.id, attempt, tx);
    });
  }
}
