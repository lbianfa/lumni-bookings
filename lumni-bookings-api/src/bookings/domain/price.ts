// Room price rules (CONTEXT §1.1). Amounts are COP cents; percentages are never rounded (D-13).

export interface Price {
  readonly baseCents: number;
  readonly discountPercent: 0 | 10 | 20;
  readonly discountCents: number;
  readonly surchargePercent: 0 | 25;
  readonly surchargeCents: number;
  readonly totalCents: number;
}

/** Duration discount tiers: only the highest tier reached applies, and the threshold itself qualifies. */
function discountPercentFor(durationMinutes: number): Price["discountPercent"] {
  if (durationMinutes >= 8 * 60) return 20;
  if (durationMinutes >= 4 * 60) return 10;
  return 0;
}

export function calculatePrice(hourlyRateCents: number, durationMinutes: number, isSaturday: boolean): Price {
  const baseCents = (hourlyRateCents * durationMinutes) / 60;
  const discountPercent = discountPercentFor(durationMinutes);
  const discountCents = (baseCents * discountPercent) / 100;
  // The Saturday surcharge applies over the already discounted value.
  const surchargePercent = isSaturday ? 25 : 0;
  const surchargeCents = ((baseCents - discountCents) * surchargePercent) / 100;

  return {
    baseCents,
    discountPercent,
    discountCents,
    surchargePercent,
    surchargeCents,
    totalCents: baseCents - discountCents + surchargeCents,
  };
}
