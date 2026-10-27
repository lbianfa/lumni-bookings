import { Module } from "@nestjs/common";

import { Clock } from "../../shared/domain/clock";
import { SystemClock } from "../../shared/infrastructure/system-clock";
import { EmailJobs } from "./application/email-jobs";
import { EmailSender } from "./application/email-sender";
import { SendOutboxEmail } from "./application/send-outbox-email.use-case";
import { OutboxEmailRepository } from "./domain/repos/outbox-email.repo";
import { EventEmitterEmailJobs, SendQueuedEmailListener } from "./jobs/event-emitter-email-jobs";
import { LocalEmailSender } from "./infrastructure/local-email-sender";
import { PrismaOutboxEmailRepository } from "./infrastructure/prisma-outbox-email.repo";
import { ResendEmailSender } from "./infrastructure/resend-email-sender";

// Resend's shared test sender, usable before the coworking verifies its own domain.
const DEFAULT_FROM = "Lumni Bookings <onboarding@resend.dev>";

// The email outbox (D-07) and its send job; bookings queues emails through the exported repository and jobs.
@Module({
  providers: [
    { provide: OutboxEmailRepository, useClass: PrismaOutboxEmailRepository },
    {
      provide: EmailSender,
      // D-10: Resend only with credentials, so the project runs without them.
      useFactory: () => {
        const apiKey = process.env.RESEND_API_KEY?.trim();
        if (!apiKey) return new LocalEmailSender();
        return new ResendEmailSender(apiKey, process.env.EMAIL_FROM?.trim() || DEFAULT_FROM);
      },
    },
    { provide: EmailJobs, useClass: EventEmitterEmailJobs },
    { provide: Clock, useClass: SystemClock },
    SendOutboxEmail,
    SendQueuedEmailListener,
  ],
  exports: [OutboxEmailRepository, EmailJobs],
})
export class EmailsModule {}
