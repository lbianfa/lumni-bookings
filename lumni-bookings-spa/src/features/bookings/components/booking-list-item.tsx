import { Link } from '@tanstack/react-router'
import { formatDateLabel } from '../../quotes/business-time'
import { SIZE_LABELS, formatCop } from '../../quotes/format'
import type { BookingListItem as BookingListItemData } from '../booking.types'
import { StatusBadge } from './status-badge'

/** The second line: where a draft stopped, the services taken, or why it was cancelled. */
function detailLine(booking: BookingListItemData): string {
  switch (booking.status) {
    case 'draft':
      return `Saved at step ${booking.currentStep} of 3`
    case 'cancelled':
      return booking.cancellationReason
        ? `Cancelled by the coworking: “${booking.cancellationReason}”`
        : 'Cancelled by the coworking'
    default:
      return booking.services.length > 0
        ? booking.services.map((service) => service.name).join(', ')
        : 'No additional services'
  }
}

interface BookingListItemProps {
  booking: BookingListItemData
}

export function BookingListItem({ booking }: BookingListItemProps) {
  const cancelled = booking.status === 'cancelled'

  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[14px] border border-line bg-white p-5">
      <div className="flex min-w-0 flex-[999_1_320px] flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge status={booking.status} variant="list" />
          <span className="font-mono text-[13px] text-muted">
            {booking.reference}
          </span>
        </div>
        <p
          className={`m-0 text-[17px] font-bold ${cancelled ? 'text-ink-soft' : ''}`}
        >
          {booking.room.name} ({SIZE_LABELS[booking.room.size]}) ·{' '}
          {formatDateLabel(booking.date)} ·{' '}
          <span className="font-mono font-medium">
            {booking.startTime}–{booking.endTime}
          </span>
        </p>
        <p className="m-0 text-sm leading-normal text-muted">
          {detailLine(booking)}
        </p>
      </div>
      <div className="flex flex-[1_1_200px] flex-wrap items-center justify-end gap-x-4 gap-y-3">
        <span
          className={`font-mono text-[15px] ${cancelled ? 'text-muted line-through' : ''}`}
        >
          {formatCop(booking.total)}
        </span>
        {booking.status === 'draft' && (
          <Link
            to="/bookings/$bookingId"
            params={{ bookingId: booking.id }}
            aria-label={`Resume booking ${booking.reference}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand px-[18px] text-sm font-bold text-brand-strong no-underline hover:bg-brand-tint"
          >
            Resume booking
          </Link>
        )}
      </div>
    </li>
  )
}
