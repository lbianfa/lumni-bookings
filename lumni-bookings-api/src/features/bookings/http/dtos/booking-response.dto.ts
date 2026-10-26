import { z } from "zod";

import type { BookingLine } from "../../../booking-lines/domain/entities/booking-line";
import { formatMinute } from "../../../quotes/domain/core/business-time";
import { priceSchema } from "../../../quotes/http/dtos/quote-response.dto";
import { roomSummarySchema } from "../../../rooms/http/dtos/room-response.dto";
import type { RoomSize } from "../../../rooms/domain/entities/room";
import { formatAmount } from "../../../../shared/http/money";
import { amountSchema, timeOfDaySchema } from "../../../../shared/http/openapi";
import type { BookingDetails } from "../../application/helpers/booking-details";
import { SERVICE_CONCEPT_PREFIX } from "../../domain/core/booking-price";
import type { BookingStatus } from "../../domain/core/booking-status";
import type { BookingStep } from "../../domain/entities/booking";

function amountOf(lines: readonly BookingLine[], concept: string): number {
  return lines.find((line) => line.concept === concept)?.amountCents ?? 0;
}

/** The percentage `part` is of `whole`; the stored amounts are exact (D-13), so this gives back 10, 20 or 25. */
function percentOf(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part * 100) / whole);
}

const bookingResponseSchema = z.object({
  id: z.uuid(),
  reference: z.string().describe("BK-<id> (D-24)"),
  status: z.enum(["draft", "confirmed", "completed", "cancelled"]),
  currentStep: z.union([z.literal(1), z.literal(2), z.literal(3)]).describe("Furthest step reached; a reopened draft resumes there"),
  customer: z.object({ fullName: z.string(), email: z.email(), company: z.string().nullable() }),
  room: roomSummarySchema,
  date: z.iso.date(),
  startTime: timeOfDaySchema,
  endTime: timeOfDaySchema,
  durationMinutes: z.int(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  price: priceSchema.extend({
    services: z.array(z.object({ code: z.string(), name: z.string(), price: amountSchema })),
  }),
  services: z
    .array(z.object({ id: z.uuid(), code: z.string(), name: z.string(), price: amountSchema, selected: z.boolean() }))
    .describe("The whole services catalog at current prices, with the draft's selection"),
  quotedAt: z.iso.datetime(),
  confirmedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime().describe("When the draft was started"),
});

// `schema` documents the response; the class must keep matching it.
export class BookingResponseDto implements z.infer<typeof bookingResponseSchema> {
  static readonly schema = bookingResponseSchema;

  readonly id: string;
  readonly reference: string;
  readonly status: BookingStatus;
  readonly currentStep: BookingStep;
  readonly customer: { fullName: string; email: string; company: string | null };
  readonly room: { id: string; name: string; size: RoomSize; hourlyRate: string };
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly price: {
    base: string;
    discountPercent: number;
    discount: string;
    surchargePercent: number;
    surcharge: string;
    services: { code: string; name: string; price: string }[];
    total: string;
  };
  readonly services: { id: string; code: string; name: string; price: string; selected: boolean }[];
  readonly quotedAt: string;
  readonly confirmedAt: string | null;
  readonly createdAt: string;

  private constructor({ booking, customer, room, lines, services, selectedServiceIds }: BookingDetails) {
    const slot = booking.slot;
    this.id = booking.id;
    // The reference is built from the id, with no column of its own.
    this.reference = `BK-${booking.id}`;
    this.status = booking.status;
    this.currentStep = booking.currentStep;
    this.customer = { fullName: customer.fullName, email: customer.email, company: customer.company };
    this.room = { id: room.id, name: room.name, size: room.size, hourlyRate: formatAmount(room.hourlyRateCents) };
    this.date = slot.date;
    this.startTime = formatMinute(slot.startMinute);
    this.endTime = formatMinute(slot.endMinute);
    this.durationMinutes = slot.durationMinutes;
    this.startsAt = booking.startsAt.toISOString();
    this.endsAt = booking.endsAt.toISOString();

    // The price comes from the stored lines, so a confirmed booking shows its frozen breakdown (D-06).
    const base = amountOf(lines, "base");
    const discount = -amountOf(lines, "discount");
    const surcharge = amountOf(lines, "surcharge");
    this.price = {
      base: formatAmount(base),
      discountPercent: percentOf(discount, base),
      discount: formatAmount(discount),
      // The Saturday surcharge applies over the already discounted value (§1.1).
      surchargePercent: percentOf(surcharge, base - discount),
      surcharge: formatAmount(surcharge),
      services: lines
        .filter((line) => line.concept.startsWith(SERVICE_CONCEPT_PREFIX))
        .map((line) => {
          const code = line.concept.slice(SERVICE_CONCEPT_PREFIX.length);
          const name = services.find((service) => service.code === code)?.name ?? code;
          return { code, name, price: formatAmount(line.amountCents) };
        }),
      total: formatAmount(booking.totalCents),
    };
    this.services = services.map((service) => ({
      id: service.id,
      code: service.code,
      name: service.name,
      price: formatAmount(service.priceCents),
      selected: selectedServiceIds.includes(service.id),
    }));
    this.quotedAt = booking.quotedAt.toISOString();
    this.confirmedAt = booking.confirmedAt?.toISOString() ?? null;
    this.createdAt = booking.createdAt.toISOString();
  }

  static from(details: BookingDetails): BookingResponseDto {
    return new BookingResponseDto(details);
  }
}
