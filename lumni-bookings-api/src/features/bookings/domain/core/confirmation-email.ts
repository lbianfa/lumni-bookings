import type { Customer } from "../../../customers/domain/entities/customer";
import { businessDateOf, formatMinute, minutesSinceStartOf } from "../../../quotes/domain/core/business-time";
import type { Room } from "../../../rooms/domain/entities/room";
import type { Booking } from "../entities/booking";

export interface ConfirmationEmail {
  readonly subject: string;
  readonly body: string;
}

const COP = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The plain-text confirmation email, rendered once when the booking is confirmed (D-09). */
export function confirmationEmailOf(booking: Booking, customer: Customer, room: Room): ConfirmationEmail {
  const reference = `BK-${booking.id}`;
  const date = businessDateOf(booking.startsAt);
  const from = formatMinute(minutesSinceStartOf(date, booking.startsAt));
  const to = formatMinute(minutesSinceStartOf(date, booking.endsAt));

  return {
    subject: `Booking confirmed: ${reference}`,
    body: [
      `Hi ${customer.fullName},`,
      "",
      `Your booking ${reference} is confirmed.`,
      "",
      `Room: ${room.name}`,
      `Date: ${date}`,
      `Time: ${from}–${to} (America/Bogota)`,
      `Total: COP ${COP.format(booking.totalCents / 100)}`,
      "",
      "Lumni",
    ].join("\n"),
  };
}
