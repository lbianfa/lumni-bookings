import { Inject, Injectable } from "@nestjs/common";

import { BookingLineRepository } from "../../booking-lines/domain/repos/booking-line.repo";
import { BookingServiceRepository } from "../../booking-services/domain/repos/booking-service.repo";
import type { QuoteRoomInput } from "../../quotes/application/quote-room.use-case";
import { UnitOfWork } from "../../../shared/application/unit-of-work";
import { Clock } from "../../../shared/domain/clock";
import { priceBooking } from "../domain/core/booking-price";
import { BookingNotEditableError } from "../domain/exceptions";
import { BookingRepository } from "../domain/repos/booking.repo";
import { BookingAccess } from "./helpers/booking-access";
import { BookingDetailsReader, type BookingDetails } from "./helpers/booking-details";
import { BookingQuoter } from "./helpers/booking-quoter";

/** Step 2: moves the draft to an available room and slot and quotes it again with its selected services. */
@Injectable()
export class SaveSchedule {
  constructor(
    @Inject(BookingAccess) private readonly access: BookingAccess,
    @Inject(BookingQuoter) private readonly quoter: BookingQuoter,
    @Inject(BookingRepository) private readonly bookings: BookingRepository,
    @Inject(BookingLineRepository) private readonly lines: BookingLineRepository,
    @Inject(BookingServiceRepository) private readonly bookingServices: BookingServiceRepository,
    @Inject(BookingDetailsReader) private readonly details: BookingDetailsReader,
    @Inject(UnitOfWork) private readonly unitOfWork: UnitOfWork,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  execute(userId: string, bookingId: string, input: QuoteRoomInput): Promise<BookingDetails> {
    return this.unitOfWork.run(async (tx) => {
      const { customer, booking } = await this.access.lock(userId, bookingId, tx);
      booking.assertCanSave(2);

      const quote = await this.quoter.quoteAvailable(input, tx);
      const services = await this.quoter.selectServices(await this.bookingServices.findServiceIds(booking.id, tx), tx);
      const price = priceBooking(quote.price, services);

      booking.reschedule(quote.room.id, quote.slot);
      booking.requote(price.totalCents, this.clock.now());
      booking.completeStep(2);
      await this.lines.replace(booking.id, price.lines, tx);
      if (!(await this.bookings.save(booking, tx))) throw new BookingNotEditableError();
      return this.details.read(booking, customer, tx);
    });
  }
}
