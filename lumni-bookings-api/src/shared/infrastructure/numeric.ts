// Money columns are `numeric(14,2)` in COP (D-13); the domain works in exact cents.

/** Exact cents from a `numeric(14,2)` value, without going through a float. */
export function toCents(amount: unknown): number {
  const text = String(amount);
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace("-", "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  return negative ? -cents : cents;
}

/** A `numeric(14,2)` value from cents. */
export function toNumeric(cents: number): string {
  return (cents / 100).toFixed(2);
}
