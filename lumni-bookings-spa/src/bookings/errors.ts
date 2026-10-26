import { ApiError } from '../api/http-client'

/**
 * The API's own message for client errors (a taken slot, an email in use, an expired quote),
 * which tells the customer what to change; the fallback otherwise.
 */
export function bookingErrorMessage(
  error: Error,
  fallback = 'The booking could not be saved. Please try again.',
): string {
  if (error instanceof ApiError && error.status < 500) return error.message
  return fallback
}
