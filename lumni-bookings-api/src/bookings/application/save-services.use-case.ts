import { Inject, Injectable } from "@nestjs/common";

import { BookingLineRepository } from "../../booking-lines/domain/repos/booking-line.repo";
import { BookingServiceRepository } from "../../booking-services/domain/repos/booking-service.repo";
import { UnitOfWork } from "../../shared/application/unit-of-work";
import { Clock } from "../../shared/domain/clock";
import { priceBooking } from "../domain/core/booking-price";
import { BookingNotEditableError } from "../domain/exceptions";
import { BookingRepository } from "../domain/repos/booking.repo";
import { BookingAccess } from "./helpers/booking-access";
import { BookingDetailsReader, type BookingDetails } from "./helpers/booking-details";
import { BookingQuoter } from "./helpers/booking-quoter";

/** Step 3: stores the selected services and quotes the draft's slot again with them (D-15). */
@Injectable()
export class SaveServices {
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

  execute(userId: string, bookingId: string, serviceIds: readonly string[]): Promise<BookingDetails> {
    const selectedIds = [...new Set(serviceIds)];

    return this.unitOfWork.run(async (tx) => {
      const { customer, booking } = await this.access.lock(userId, bookingId, tx);
      booking.assertCanSave(3);

      const services = await this.quoter.selectServices(selectedIds, tx);
      const quote = await this.quoter.quoteCurrentSlot(booking, tx);
      const price = priceBooking(quote.price, services);

      booking.requote(price.totalCents, this.clock.now());
      booking.completeStep(3);
      await this.bookingServices.replace(booking.id, selectedIds, tx);
      await this.lines.replace(booking.id, price.lines, tx);
      if (!(await this.bookings.save(booking, tx))) throw new BookingNotEditableError();
      return this.details.read(booking, customer, tx);
    });
  }
}
