import { QuoteExpiredError } from "../exceptions";

// A quote whose price changed is honored while it is less than two weeks old (D-18).
const QUOTE_VALIDITY_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * D-18 confirm rule: the quoted total is kept when it still matches the current price, or when prices
 * changed but the quote is less than two weeks old; otherwise the customer must quote again.
 */
export function assertQuoteHonored(quotedTotalCents: number, currentTotalCents: number, quotedAt: Date, now: Date): void {
  if (quotedTotalCents === currentTotalCents) return;
  if (now.getTime() - quotedAt.getTime() < QUOTE_VALIDITY_MS) return;
  throw new QuoteExpiredError();
}
