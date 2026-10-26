/** COP amount as a decimal string with two places, matching the `numeric(14,2)` storage (D-13). */
export function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}
