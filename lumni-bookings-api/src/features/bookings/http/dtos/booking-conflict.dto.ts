import { z } from "zod";

import { errorBodySchema } from "../../../../shared/http/openapi";
import { unavailabilityCodeSchema } from "../../../quotes/http/dtos/quote-response.dto";

/** The `code` of a booking flow `409` (see `BookingsExceptionFilter`). */
export type BookingConflictCode =
  | "slot_unavailable"
  | "slot_taken"
  | "email_taken"
  | "not_editable"
  | "step_not_reached"
  | "quote_expired";

/** Documents a `409` limited to the codes one route can answer; `slot_unavailable` also carries the quote's `reason`. */
export function bookingConflictSchema(...codes: [BookingConflictCode, ...BookingConflictCode[]]) {
  const body = errorBodySchema.extend({ code: z.enum(codes) });
  return codes.includes("slot_unavailable")
    ? body.extend({ reason: unavailabilityCodeSchema.optional().describe("With slot_unavailable: why the slot is not available") })
    : body;
}
