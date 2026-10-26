import { ApiBody, ApiResponse, type SchemaObject } from "@nestjs/swagger";
import { z } from "zod";

// Response schemas for the OpenAPI docs (/api/docs). They are zod schemas so @nestjs/swagger converts them like the request bodies.

/** The body every error answers with: Nest's own exceptions and the feature exception filters. */
export const errorBodySchema = z.object({
  statusCode: z.int(),
  message: z.string(),
  error: z.string().optional().describe("Status text, on Nest's built-in exceptions (e.g. a wrong password or malformed JSON)"),
});

/** A `400`: an invalid request body (`ZodValidationPipe`, with `errors` per field) or an invalid value the use case rejects. */
export const badRequestBodySchema = errorBodySchema.extend({
  errors: z.record(z.string(), z.array(z.string())).optional().describe("Messages per invalid field, for an invalid body"),
});

/** COP amount as a decimal string with two places (D-13). */
export const amountSchema = z.string().regex(/^-?\d+\.\d{2}$/).describe("COP, decimal string with two places");

/** Business time as HH:mm (America/Bogota, D-02). */
export const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).describe("HH:mm, America/Bogota");

/**
 * Documents a JSON request body from the zod schema `ZodValidationPipe` validates it with (its input shape, before
 * transforms). `@Body({ schema })` cannot do it: swagger finds body parameters through decorator type metadata,
 * which `tsx` does not emit.
 */
export function ApiJsonBody(schema: z.ZodType) {
  return ApiBody({ schema: z.toJSONSchema(schema, { target: "openapi-3.0", io: "input" }) as SchemaObject });
}

/** Documents one error status with its body; on a controller it applies to every route. */
export function ApiError(status: number, description: string, schema: z.ZodType = errorBodySchema) {
  return ApiResponse({ status, description, standardSchema: schema });
}
