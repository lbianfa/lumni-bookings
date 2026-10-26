import type { BookingStatus } from '../booking.types'
import { StatusBadge } from './status-badge'

interface BookingHeaderProps {
  status: BookingStatus
  reference: string
  title: string
  /** Shows "Draft saved" once a step has been saved on this page. */
  saved: boolean
}

export function BookingHeader({
  status,
  reference,
  title,
  saved,
}: BookingHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge status={status} variant="heading" />
          <span className="font-mono text-[13px] text-muted">{reference}</span>
        </div>
        <h1 className="m-0 text-[32px] leading-tight font-bold tracking-[-0.02em]">
          {title}
        </h1>
      </div>
      <p
        role="status"
        className="m-0 inline-flex items-center gap-2 text-sm text-brand-strong"
      >
        {saved && (
          <>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Draft saved
          </>
        )}
      </p>
    </div>
  )
}
