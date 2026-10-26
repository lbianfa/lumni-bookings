import { Inject, Injectable } from "@nestjs/common";

import { QuoteRoom, type Quote, type QuoteRoomInput } from "../../../quotes/application/quote-room.use-case";
import type { Service } from "../../../services/domain/entities/service";
import { ServiceRepository } from "../../../services/domain/repos/service.repo";
import type { Transaction } from "../../../../shared/application/unit-of-work";
import type { Booking } from "../../domain/entities/booking";
import { SlotUnavailableError, UnknownServiceError } from "../../domain/exceptions";

// Quotes and services the booking flow prices with: the same rules as the quote page (§1.1, D-21).
@Injectable()
export class BookingQuoter {
  constructor(
    @Inject(QuoteRoom) private readonly quoteRoom: QuoteRoom,
    @Inject(ServiceRepository) private readonly services: ServiceRepository,
  ) {}

  /** Quotes the slot; it must be available. */
  async quoteAvailable(input: QuoteRoomInput, tx?: Transaction): Promise<Quote> {
    const quote = await this.quoteRoom.execute(input, tx);
    if (quote.unavailability) throw new SlotUnavailableError(quote.unavailability, quote.slot, quote.room);
    return quote;
  }

  /** Quotes the booking's current room and slot again; it must still be available. */
  quoteCurrentSlot(booking: Booking, tx?: Transaction): Promise<Quote> {
    const { date, startMinute, durationMinutes } = booking.slot;
    return this.quoteAvailable({ roomId: booking.roomId, date, startMinute, durationMinutes }, tx);
  }

  /** The catalog services with those ids, at their current price; every id must exist. */
  async selectServices(serviceIds: readonly string[], tx?: Transaction): Promise<Service[]> {
    const catalog = await this.services.list(tx);
    const selected = catalog.filter((service) => serviceIds.includes(service.id));
    if (selected.length !== new Set(serviceIds).size) throw new UnknownServiceError();
    return selected;
  }
}
