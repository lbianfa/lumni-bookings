import { Inject, Injectable } from "@nestjs/common";

import type { EmailAttempt } from "../domain/entities/email-attempt";
import type { OutboxEmail } from "../domain/entities/outbox-email";
import { EmailNotFoundError } from "../domain/exceptions";
import { OutboxEmailRepository } from "../domain/repos/outbox-email.repo";

export interface BookingEmail {
  readonly email: OutboxEmail;
  /** Oldest first. */
  readonly attempts: readonly EmailAttempt[];
}

/** The admin's view of a booking's confirmation email: its outbox row and every send attempt. */
@Injectable()
export class GetBookingEmail {
  constructor(@Inject(OutboxEmailRepository) private readonly outbox: OutboxEmailRepository) {}

  async execute(bookingId: string): Promise<BookingEmail> {
    const email = await this.outbox.findByBooking(bookingId, "booking_confirmation");
    if (!email) throw new EmailNotFoundError();
    return { email, attempts: await this.outbox.findAttempts(email.id) };
  }
}
