import { Inject, Injectable } from "@nestjs/common";

import { BookingServiceRepository } from "../../booking-services/domain/repos/booking-service.repo";
import { EmailJobs } from "../../emails/application/email-jobs";
import { OutboxEmailRepository } from "../../emails/domain/repos/outbox-email.repo";
import { UnitOfWork } from "../../../shared/application/unit-of-work";
import { Clock } from "../../../shared/domain/clock";
import { priceBooking } from "../domain/core/booking-price";
import { confirmationEmailOf } from "../domain/core/confirmation-email";
import { assertQuoteHonored } from "../domain/core/quote-validity";
import { BookingNotEditableError } from "../domain/exceptions";
import { BookingRepository } from "../domain/repos/booking.repo";
import { BookingAccess } from "./helpers/booking-access";
import { BookingDetailsReader, type BookingDetails } from "./helpers/booking-details";
import { BookingQuoter } from "./helpers/booking-quoter";

/**
 * `draft → confirmed` at the quoted price (D-18). Idempotent (D-06): a confirmed booking is returned as is.
 * Two drafts racing for one slot are settled by the exclusion constraint (D-05): the loser gets `SlotTakenError`.
 * The confirmation email is queued in the same transaction (D-07) and sent by a job once it commits.
 */
@Injectable()
export class ConfirmBooking {
  constructor(
    @Inject(BookingAccess) private readonly access: BookingAccess,
    @Inject(BookingQuoter) private readonly quoter: BookingQuoter,
    @Inject(BookingRepository) private readonly bookings: BookingRepository,
    @Inject(BookingServiceRepository) private readonly bookingServices: BookingServiceRepository,
    @Inject(BookingDetailsReader) private readonly details: BookingDetailsReader,
    @Inject(OutboxEmailRepository) private readonly outbox: OutboxEmailRepository,
    @Inject(EmailJobs) private readonly emailJobs: EmailJobs,
    @Inject(UnitOfWork) private readonly unitOfWork: UnitOfWork,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  async execute(userId: string, bookingId: string): Promise<BookingDetails> {
    const { details, emailId } = await this.unitOfWork.run(async (tx) => {
      // The row lock makes a repeated confirm wait for the first one and then see it confirmed.
      const { customer, booking } = await this.access.lock(userId, bookingId, tx);
      if (booking.status === "confirmed") return { details: await this.details.read(booking, customer, tx), emailId: null };
      booking.assertCanConfirm();

      const quote = await this.quoter.quoteCurrentSlot(booking, tx);
      const services = await this.quoter.selectServices(await this.bookingServices.findServiceIds(booking.id, tx), tx);
      const now = this.clock.now();
      assertQuoteHonored(booking.totalCents, priceBooking(quote.price, services).totalCents, booking.quotedAt, now);

      // The quoted total and its lines stay as they are: they become the agreed price.
      booking.confirm(now);
      if (!(await this.bookings.save(booking, tx))) throw new BookingNotEditableError();
      const details = await this.details.read(booking, customer, tx);

      // Rendered once, now, and stored with the confirmation (D-07, D-09).
      const emailId = await this.outbox.add(
        {
          bookingId: booking.id,
          type: "booking_confirmation",
          toAddress: customer.email,
          ...confirmationEmailOf(booking, customer, details.room),
        },
        tx,
      );
      return { details, emailId };
    });

    // Only after the commit, so the job never reads a row that could still roll back; the response does not wait for it.
    if (emailId) this.emailJobs.enqueue(emailId);
    return details;
  }
}
