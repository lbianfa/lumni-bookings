import { Inject, Injectable } from "@nestjs/common";

import { BookingLineRepository } from "../../booking-lines/domain/repos/booking-line.repo";
import type { QuoteRoomInput } from "../../quotes/application/quote-room.use-case";
import { UnitOfWork } from "../../shared/application/unit-of-work";
import { Clock } from "../../shared/domain/clock";
import { priceBooking } from "../domain/core/booking-price";
import { Booking } from "../domain/entities/booking";
import { BookingRepository } from "../domain/repos/booking.repo";
import { BookingAccess } from "./helpers/booking-access";
import { BookingDetailsReader, type BookingDetails } from "./helpers/booking-details";
import { BookingQuoter } from "./helpers/booking-quoter";

/** "Start booking" on the quote page: a priced draft of an available quoted slot. */
@Injectable()
export class StartBooking {
  constructor(
    @Inject(BookingAccess) private readonly access: BookingAccess,
    @Inject(BookingQuoter) private readonly quoter: BookingQuoter,
    @Inject(BookingRepository) private readonly bookings: BookingRepository,
    @Inject(BookingLineRepository) private readonly lines: BookingLineRepository,
    @Inject(BookingDetailsReader) private readonly details: BookingDetailsReader,
    @Inject(UnitOfWork) private readonly unitOfWork: UnitOfWork,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  async execute(userId: string, input: QuoteRoomInput): Promise<BookingDetails> {
    const customer = await this.access.customerOf(userId);
    const quote = await this.quoter.quoteAvailable(input);
    const price = priceBooking(quote.price, []);

    return this.unitOfWork.run(async (tx) => {
      const booking = await this.bookings.create(
        Booking.startDraft(customer.id, quote.room.id, quote.slot, price.totalCents, this.clock.now()),
        tx,
      );
      await this.lines.replace(booking.id, price.lines, tx);
      return this.details.read(booking, customer, tx);
    });
  }
}
