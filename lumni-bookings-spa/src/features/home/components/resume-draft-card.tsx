import { Link } from '@tanstack/react-router'
import type { BookingListItem } from '../../bookings/booking.types'
import { StatusBadge } from '../../bookings/components/status-badge'
import { formatDateLabel } from '../../quotes/business-time'

interface ResumeDraftCardProps {
  draft: BookingListItem
}

export function ResumeDraftCard({ draft }: ResumeDraftCardProps) {
  return (
    <section
      aria-labelledby="draft-title"
      className="flex flex-wrap items-center gap-x-7 gap-y-4 rounded-2xl border border-line bg-white px-7 py-6"
    >
      <div className="flex min-w-0 flex-[999_1_360px] flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 id="draft-title" className="m-0 text-[17px] font-bold">
            Pick up where you left off
          </h2>
          <StatusBadge status={draft.status} variant="list" />
        </div>
        <p className="m-0 text-sm text-muted">
          {draft.room.name} · {formatDateLabel(draft.date)} ·{' '}
          <span className="font-mono">
            {draft.startTime}–{draft.endTime}
          </span>{' '}
          · Step {draft.currentStep} of 3
        </p>
      </div>
      <Link
        to="/bookings/$bookingId"
        params={{ bookingId: draft.id }}
        aria-label={`Resume booking ${draft.reference}`}
        className="inline-flex min-h-12 flex-auto items-center justify-center rounded-xl border border-brand px-[22px] text-[15px] font-bold whitespace-nowrap text-brand-strong no-underline hover:bg-brand-tint"
      >
        Resume booking
      </Link>
    </section>
  )
}
