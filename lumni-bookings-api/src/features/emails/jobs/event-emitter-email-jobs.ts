import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";

import { EmailJobs } from "../application/email-jobs";
import { SendOutboxEmail } from "../application/send-outbox-email.use-case";

const EMAIL_QUEUED = "email.queued";

interface EmailQueuedEvent {
  readonly emailId: string;
}

/** Starts the send job with an in-process event. */
@Injectable()
export class EventEmitterEmailJobs extends EmailJobs {
  constructor(@Inject(EventEmitter2) private readonly events: EventEmitter2) {
    super();
  }

  enqueue(emailId: string): void {
    this.events.emit(EMAIL_QUEUED, { emailId } satisfies EmailQueuedEvent);
  }
}

/** The send job: one attempt per queued email. */
@Injectable()
export class SendQueuedEmailListener {
  constructor(@Inject(SendOutboxEmail) private readonly sendOutboxEmail: SendOutboxEmail) {}

  // `async` runs it after `emit` returns, so the request that queued the email never waits for the send.
  // A thrown error is logged by the emitter (`suppressErrors` is on by default) and leaves the row pending.
  @OnEvent(EMAIL_QUEUED, { async: true })
  handle({ emailId }: EmailQueuedEvent): Promise<void> {
    return this.sendOutboxEmail.execute(emailId);
  }
}
