import type { ReactNode } from 'react'
import { formatFullDateLabel, formatMoment } from '../../quotes/business-time'
import { SIZE_LABELS, formatHours } from '../../quotes/format'
import type { Booking } from '../booking.types'
import { PriceBreakdown } from './price-breakdown'
import { StatusBadge } from './status-badge'

function DetailSection({
  id,
  title,
  aside,
  children,
}: {
  id: string
  title: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="m-0 text-base font-bold">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  mono = false,
  children,
}: {
  label: string
  mono?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd
        className={`mt-1 mb-0 [overflow-wrap:anywhere] ${mono ? 'font-mono' : 'font-semibold'}`}
      >
        {children}
      </dd>
    </div>
  )
}

function HistoryEntry({
  dot,
  label,
  at,
}: {
  dot: string
  label: string
  at: string
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className={`mt-[5px] size-2.5 flex-none rounded-full ${dot}`}
      />
      <span>
        <strong>{label}</strong> ·{' '}
        <span className="text-muted">{formatMoment(at)}</span>
      </span>
    </li>
  )
}

interface BookingRecordProps {
  /** Shown read-only: a customer's booking that is no longer a draft, or any booking for the admin. */
  booking: Booking
  /** The link back to the page the detail was opened from, if any. */
  backLink?: ReactNode
  /** True right after this page confirmed it: shows the confirmation banner. */
  justConfirmed?: boolean
  /**
   * A box beside the booking's sections, such as the admin's confirmation email; wraps below them on narrow screens.
   * Without it, the sections take the whole row.
   */
  aside?: ReactNode
}

// The booking detail of the customer and the admin, after the admin detail design without the cancel action.
export function BookingRecord({
  booking,
  backLink,
  justConfirmed = false,
  aside,
}: BookingRecordProps) {
  const services = booking.price.services

  return (
    <div className="flex max-w-[1200px] flex-col gap-6">
      {backLink}
      <div className="flex flex-wrap items-center gap-3.5">
        <h1 className="m-0 font-mono text-[30px] font-medium tracking-[-0.01em] [overflow-wrap:anywhere]">
          {booking.reference}
        </h1>
        <StatusBadge status={booking.status} variant="detail" />
      </div>

      {justConfirmed && booking.status === 'confirmed' && (
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
            <p className="mt-1 mb-0 text-sm leading-snug">
              The price below is locked.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <DetailSection id="booking-title" title="Booking">
            <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <Field label="Customer">{booking.customer.fullName}</Field>
              <Field label="Email">{booking.customer.email}</Field>
              <Field label="Company">
                {booking.customer.company ?? 'None'}
              </Field>
              <Field label="Room">
                {booking.room.name} ({SIZE_LABELS[booking.room.size]})
              </Field>
              <Field label="Date">{formatFullDateLabel(booking.date)}</Field>
              <Field label="Time" mono>
                {booking.startTime}–{booking.endTime} ·{' '}
                {formatHours(booking.durationMinutes)}
              </Field>
              <Field label="Services">
                {services.length > 0
                  ? services.map((service) => service.name).join(', ')
                  : 'None'}
              </Field>
            </dl>
          </DetailSection>

          <DetailSection
            id="price-title"
            title="Price"
            aside={
              booking.confirmedAt && (
                <span className="text-[13px] text-muted">
                  Locked at confirmation · {formatMoment(booking.confirmedAt)}
                </span>
              )
            }
          >
            <PriceBreakdown
              price={booking.price}
              durationMinutes={booking.durationMinutes}
              hourlyRate={booking.room.hourlyRate}
            />
          </DetailSection>

          <DetailSection id="history-title" title="Status history">
            <ol className="m-0 flex list-none flex-col gap-3.5 p-0 text-sm">
              <HistoryEntry
                dot="bg-line-strong"
                label="Draft created"
                at={booking.createdAt}
              />
              {booking.confirmedAt && (
                <HistoryEntry
                  dot="bg-brand"
                  label="Confirmed"
                  at={booking.confirmedAt}
                />
              )}
            </ol>
          </DetailSection>
        </div>
        {aside}
      </div>
    </div>
  )
}
