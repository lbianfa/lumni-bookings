import { Inject, Injectable } from "@nestjs/common";

import { BookingServiceRepository } from "../../booking-services/domain/repos/booking-service.repo";
import { UnitOfWork } from "../../../shared/application/unit-of-work";
import { Clock } from "../../../shared/domain/clock";
import { priceBooking } from "../domain/core/booking-price";
import { assertQuoteHonored } from "../domain/core/quote-validity";
import { BookingNotEditableError } from "../domain/exceptions";
import { BookingRepository } from "../domain/repos/booking.repo";
import { BookingAccess } from "./helpers/booking-access";
import { BookingDetailsReader, type BookingDetails } from "./helpers/booking-details";
import { BookingQuoter } from "./helpers/booking-quoter";

/**
 * `draft → confirmed` at the quoted price (D-18). Idempotent (D-06): a confirmed booking is returned as is.
 * Two drafts racing for one slot are settled by the exclusion constraint (D-05): the loser gets `SlotTakenError`.
 */
@Injectable()
export class ConfirmBooking {
  constructor(
    @Inject(BookingAccess) private readonly access: BookingAccess,
    @Inject(BookingQuoter) private readonly quoter: BookingQuoter,
    @Inject(BookingRepository) private readonly bookings: BookingRepository,
    @Inject(BookingServiceRepository) private readonly bookingServices: BookingServiceRepository,
    @Inject(BookingDetailsReader) private readonly details: BookingDetailsReader,
    @Inject(UnitOfWork) private readonly unitOfWork: UnitOfWork,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  execute(userId: string, bookingId: string): Promise<BookingDetails> {
    return this.unitOfWork.run(async (tx) => {
      // The row lock makes a repeated confirm wait for the first one and then see it confirmed.
      const { customer, booking } = await this.access.lock(userId, bookingId, tx);
      if (booking.status === "confirmed") return this.details.read(booking, customer, tx);
      booking.assertCanConfirm();

      const quote = await this.quoter.quoteCurrentSlot(booking, tx);
      const services = await this.quoter.selectServices(await this.bookingServices.findServiceIds(booking.id, tx), tx);
      const now = this.clock.now();
      assertQuoteHonored(booking.totalCents, priceBooking(quote.price, services).totalCents, booking.quotedAt, now);

      // The quoted total and its lines stay as they are: they become the agreed price.
      booking.confirm(now);
      if (!(await this.bookings.save(booking, tx))) throw new BookingNotEditableError();
      return this.details.read(booking, customer, tx);
    });
  }
}
