import { z } from "zod";

import { formatMinute } from "../../../quotes/domain/core/business-time";
import type { RoomSize } from "../../../rooms/domain/entities/room";
import { roomSummarySchema } from "../../../rooms/http/dtos/room-response.dto";
import { formatAmount } from "../../../../shared/http/money";
import { amountSchema, timeOfDaySchema } from "../../../../shared/http/openapi";
import type { BookingSummary } from "../../application/helpers/booking-summaries";
import type { BookingStatus } from "../../domain/core/booking-status";
import type { BookingStep } from "../../domain/entities/booking";

export const bookingListItemSchema = z.object({
  id: z.uuid(),
  reference: z.string().describe("BK-<id> (D-24)"),
  status: z.enum(["draft", "confirmed", "completed", "cancelled"]),
  currentStep: z.union([z.literal(1), z.literal(2), z.literal(3)]).describe("Furthest step reached; a reopened draft resumes there"),
  room: roomSummarySchema.pick({ id: true, name: true, size: true }),
  date: z.iso.date(),
  startTime: timeOfDaySchema,
  endTime: timeOfDaySchema,
  total: amountSchema.describe("The stored booking total; frozen once confirmed (D-06)"),
  services: z.array(z.object({ code: z.string(), name: z.string() })).describe("The selected services, in catalog order"),
  cancellationReason: z.string().nullable().describe("Why the coworking cancelled it; null unless cancelled with a reason"),
  createdAt: z.iso.datetime(),
});

// One item of My bookings; `schema` documents it (the class must keep matching it).
export class BookingListItemDto implements z.infer<typeof bookingListItemSchema> {
  static readonly schema = bookingListItemSchema;

  readonly id: string;
  readonly reference: string;
  readonly status: BookingStatus;
  readonly currentStep: BookingStep;
  readonly room: { id: string; name: string; size: RoomSize };
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly total: string;
  readonly services: { code: string; name: string }[];
  readonly cancellationReason: string | null;
  readonly createdAt: string;

  private constructor({ booking, room, services }: BookingSummary) {
    const slot = booking.slot;
    this.id = booking.id;
    // The reference is built from the id, with no column of its own.
    this.reference = `BK-${booking.id}`;
    this.status = booking.status;
    this.currentStep = booking.currentStep;
    this.room = { id: room.id, name: room.name, size: room.size };
    this.date = slot.date;
    this.startTime = formatMinute(slot.startMinute);
    this.endTime = formatMinute(slot.endMinute);
    this.total = formatAmount(booking.totalCents);
    this.services = services.map((service) => ({ code: service.code, name: service.name }));
    this.cancellationReason = booking.cancellationReason;
    this.createdAt = booking.createdAt.toISOString();
  }

  static from(summary: BookingSummary): BookingListItemDto {
    return new BookingListItemDto(summary);
  }
}
