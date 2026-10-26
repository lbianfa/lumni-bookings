/**
 * One line of a booking's price breakdown. Concepts: `base`, `discount`, `surcharge` and `service:<code>`.
 * Amounts are signed COP cents (the discount is negative), so the lines add up to the booking total.
 */
export interface BookingLine {
  readonly concept: string;
  readonly amountCents: number;
}
