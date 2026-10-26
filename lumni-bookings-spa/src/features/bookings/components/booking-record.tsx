import { SIZE_LABELS } from '../../quotes/format'
import type { Booking } from '../booking.types'
import { BackToQuoteLink } from './back-to-quote-link'
import { BookingHeader } from './booking-header'
import { BookingSummary } from './booking-summary'

/** `Oct 26, 2026, 3:42 PM`, in business time (README D-02). */
function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

interface BookingRecordProps {
  /** A booking that is no longer a draft: shown read-only. */
  booking: Booking
}

export function BookingRecord({ booking }: BookingRecordProps) {
  return (
    <div className="flex flex-col gap-6">
      <BackToQuoteLink />
      <BookingHeader
        status={booking.status}
        reference={booking.reference}
        title={`${booking.room.name} (${SIZE_LABELS[booking.room.size]})`}
        saved={false}
      />
      {booking.status === 'confirmed' && (
        <div
          role="status"
          className="flex gap-3 rounded-xl bg-brand-tint px-4 py-3.5 text-brand-strong"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="mt-0.5 flex-none"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <div>
            <p className="m-0 font-bold">
              Booking {booking.reference} confirmed
            </p>
            {booking.confirmedAt && (
              <p className="mt-1 mb-0 text-sm leading-snug">
                Confirmed on {formatTimestamp(booking.confirmedAt)}. The price
                below is locked.
              </p>
            )}
          </div>
        </div>
      )}
      <div className="flex max-w-[640px]">
        <BookingSummary booking={booking} />
      </div>
    </div>
  )
}
