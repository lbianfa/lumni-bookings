import { z } from "zod";

import type { Quote } from "../../application/quote-room.use-case";
import { CLOSING_MINUTE, OPENING_MINUTE, type Unavailability } from "../../domain/core/availability";
import { formatMinute } from "../../domain/core/business-time";
import type { RoomSize } from "../../../rooms/domain/entities/room";
import { formatAmount } from "../../../../shared/http/money";
import { amountSchema, timeOfDaySchema } from "../../../../shared/http/openapi";
import { roomSummarySchema } from "../../../rooms/http/dtos/room-response.dto";

/** The message for an unavailability reason; the booking flow reuses it for its `slot_unavailable` errors. */
export function describeUnavailability(reason: Unavailability, quote: Pick<Quote, "slot" | "room">): string {
  switch (reason.code) {
    case "closed_day":
      return "The coworking is closed on Sundays. Pick a day from Monday to Saturday.";
    case "outside_opening_hours":
      return quote.slot.startMinute < OPENING_MINUTE
        ? `The coworking opens at ${formatMinute(OPENING_MINUTE)}. Pick a later start time.`
        : `A booking starting at ${formatMinute(quote.slot.startMinute)} would end after closing time (${formatMinute(CLOSING_MINUTE)}).`;
    case "in_the_past":
      return "That start time has already passed. Pick a later one.";
    case "room_booked":
      return `${quote.room.name} already has a confirmed booking from ${formatMinute(reason.conflict.startMinute)} to ${formatMinute(reason.conflict.endMinute)}.`;
  }
}

/** Why a slot is not available; the booking flow answers it as the `reason` of `slot_unavailable`. */
export const unavailabilityCodeSchema = z.enum(["closed_day", "outside_opening_hours", "in_the_past", "room_booked"]);

/** The price breakdown (D-15); discount and surcharge are positive amounts. */
export const priceSchema = z.object({
  base: amountSchema,
  discountPercent: z.int(),
  discount: amountSchema,
  surchargePercent: z.int(),
  surcharge: amountSchema,
  total: amountSchema,
});

const quoteResponseSchema = z.object({
  room: roomSummarySchema,
  date: z.iso.date(),
  startTime: timeOfDaySchema,
  durationMinutes: z.int(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  price: priceSchema,
  available: z.boolean(),
  reason: z.object({ code: unavailabilityCodeSchema, message: z.string() }).nullable(),
  suggestion: z.object({ startTime: timeOfDaySchema, endTime: timeOfDaySchema }).nullable(),
});

// `schema` documents the response; the class must keep matching it.
export class QuoteResponseDto implements z.infer<typeof quoteResponseSchema> {
  static readonly schema = quoteResponseSchema;

  readonly room: { id: string; name: string; size: RoomSize; hourlyRate: string };
  readonly date: string;
  readonly startTime: string;
  readonly durationMinutes: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly price: {
    base: string;
    discountPercent: number;
    discount: string;
    surchargePercent: number;
    surcharge: string;
    total: string;
  };
  readonly available: boolean;
  readonly reason: { code: Unavailability["code"]; message: string } | null;
  readonly suggestion: { startTime: string; endTime: string } | null;

  private constructor(quote: Quote) {
    const { room, slot, price, unavailability, suggestion } = quote;
    this.room = { id: room.id, name: room.name, size: room.size, hourlyRate: formatAmount(room.hourlyRateCents) };
    this.date = slot.date;
    this.startTime = formatMinute(slot.startMinute);
    this.durationMinutes = slot.durationMinutes;
    this.startsAt = slot.startsAt.toISOString();
    this.endsAt = slot.endsAt.toISOString();
    this.price = {
      base: formatAmount(price.baseCents),
      discountPercent: price.discountPercent,
      discount: formatAmount(price.discountCents),
      surchargePercent: price.surchargePercent,
      surcharge: formatAmount(price.surchargeCents),
      total: formatAmount(price.totalCents),
    };
    this.available = unavailability === null;
    this.reason = unavailability ? { code: unavailability.code, message: describeUnavailability(unavailability, quote) } : null;
    this.suggestion = suggestion
      ? { startTime: formatMinute(suggestion.startMinute), endTime: formatMinute(suggestion.endMinute) }
      : null;
  }

  static from(quote: Quote): QuoteResponseDto {
    return new QuoteResponseDto(quote);
  }
}
