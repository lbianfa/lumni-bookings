import type { ReactNode } from 'react'
import { formatDateLabel } from '../../quotes/business-time'
import { SIZE_LABELS } from '../../quotes/format'
import type { Booking } from '../booking.types'
import { PriceBreakdown } from './price-breakdown'

interface BookingSummaryProps {
  booking: Booking
  /** Shown under the price, e.g. the confirm button. */
  children?: ReactNode
}

export function BookingSummary({ booking, children }: BookingSummaryProps) {
  const services = booking.price.services
  return (
    <aside
      aria-labelledby="summary-title"
      className="flex min-w-0 flex-[1_1_360px] flex-col gap-[18px] rounded-2xl border border-line bg-white p-6"
    >
      <h2 id="summary-title" className="m-0 text-lg font-bold">
        Summary
      </h2>
      <dl className="m-0 flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Customer</dt>
          <dd className="m-0 text-right font-semibold">
            {booking.customer.fullName}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Room</dt>
          <dd className="m-0 text-right font-semibold">
            {booking.room.name} ({SIZE_LABELS[booking.room.size]})
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">When</dt>
          <dd className="m-0 text-right font-semibold">
            {formatDateLabel(booking.date)} ·{' '}
            <span className="font-mono font-normal">
              {booking.startTime}–{booking.endTime}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Services</dt>
          <dd className="m-0 text-right font-semibold">
            {services.length > 0
              ? services.map((service) => service.name).join(', ')
              : 'None'}
          </dd>
        </div>
      </dl>
      <div className="border-t border-line pt-4">
        <PriceBreakdown
          price={booking.price}
          durationMinutes={booking.durationMinutes}
          hourlyRate={booking.room.hourlyRate}
          largeTotal
        />
      </div>
      {children}
    </aside>
  )
}
