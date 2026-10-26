// Postgres SQLSTATE codes the adapters translate into domain errors.
export const UNIQUE_VIOLATION = "23505";
export const EXCLUSION_VIOLATION = "23P01";

/** Whether `error`, or any error in its `cause` chain, is a driver error with that SQLSTATE. */
export function isDatabaseError(error: unknown, sqlState: string): boolean {
  for (let current = error; current instanceof Object; current = (current as { cause?: unknown }).cause) {
    if ((current as { sqlState?: unknown }).sqlState === sqlState) return true;
  }
  return false;
}
