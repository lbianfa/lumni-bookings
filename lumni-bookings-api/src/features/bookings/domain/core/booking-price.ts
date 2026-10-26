import type { BookingLine } from "../../../booking-lines/domain/entities/booking-line";
import type { Price } from "../../../quotes/domain/core/price";
import type { Service } from "../../../services/domain/entities/service";

export interface BookingPrice {
  /** The breakdown snapshot; its amounts add up to `totalCents`. */
  readonly lines: readonly BookingLine[];
  readonly totalCents: number;
}

export const SERVICE_CONCEPT_PREFIX = "service:";

/**
 * Booking price (D-15): the room price, whose discount and surcharge apply only to the room base,
 * plus each selected service at its flat price (D-14). Zero discount or surcharge lines are left out.
 */
export function priceBooking(roomPrice: Price, services: readonly Service[]): BookingPrice {
  const lines: BookingLine[] = [{ concept: "base", amountCents: roomPrice.baseCents }];
  if (roomPrice.discountCents !== 0) lines.push({ concept: "discount", amountCents: -roomPrice.discountCents });
  if (roomPrice.surchargeCents !== 0) lines.push({ concept: "surcharge", amountCents: roomPrice.surchargeCents });
  for (const service of services) {
    lines.push({ concept: `${SERVICE_CONCEPT_PREFIX}${service.code}`, amountCents: service.priceCents });
  }

  return { lines, totalCents: lines.reduce((total, line) => total + line.amountCents, 0) };
}
