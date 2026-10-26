import type { BookingStatus } from '../booking.types'

const STATUS_STYLES: Record<BookingStatus, string> = {
  draft: 'bg-neutral-tint text-ink-soft',
  confirmed: 'bg-brand-tint text-brand-strong',
  completed: 'bg-info-tint text-info',
  cancelled: 'bg-danger-tint text-danger',
}

const VARIANT_STYLES = {
  /** Above a booking page title: uppercase. */
  heading: 'min-h-[26px] px-2.5 text-xs tracking-[0.04em] uppercase',
  /** In a list row: capitalized. */
  list: 'min-h-6 px-2.5 text-xs capitalize',
  /** Next to the reference heading of the booking detail. */
  detail: 'min-h-7 px-3 text-[13px] capitalize',
}

interface StatusBadgeProps {
  status: BookingStatus
  variant: keyof typeof VARIANT_STYLES
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${VARIANT_STYLES[variant]} ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}
