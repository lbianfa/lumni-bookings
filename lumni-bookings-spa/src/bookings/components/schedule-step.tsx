import { RoomOptions } from '../../rooms/components/room-options'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  SLOT_MINUTES,
  businessNow,
  formatDateLabel,
  formatMinute,
  parseTime,
  startTimeOptions,
} from '../../quotes/business-time'
import { DateField } from '../../quotes/components/date-field'
import { SIZE_LABELS, formatCop, formatHours } from '../../quotes/format'
import { quoteQueryOptions } from '../../quotes/queries'
import type { Quote } from '../../quotes/quote.types'
import { roomsQueryOptions } from '../../rooms/queries'
import type { Booking } from '../booking.types'
import { bookingErrorMessage } from '../errors'
import { useSaveScheduleMutation } from '../queries'
import { PriceBreakdown } from './price-breakdown'

const DURATIONS: number[] = []
for (
  let minutes = MIN_DURATION_MINUTES;
  minutes <= MAX_DURATION_MINUTES;
  minutes += SLOT_MINUTES
) {
  DURATIONS.push(minutes)
}

const fieldClass =
  'min-h-12 rounded-[10px] border border-line-strong bg-white px-3 text-[15px] text-ink'

interface ScheduleStepProps {
  booking: Booking
  onBack: () => void
  onSaved: () => void
}

export function ScheduleStep({ booking, onBack, onSaved }: ScheduleStepProps) {
  const { data: rooms } = useSuspenseQuery(roomsQueryOptions)
  const save = useSaveScheduleMutation(booking.id)
  // Prefilled from the draft; every change is quoted again below.
  const [roomId, setRoomId] = useState(booking.room.id)
  const [selectedDate, setSelectedDate] = useState(booking.date)
  const [selectedStart, setSelectedStart] = useState(booking.startTime)
  const [durationMinutes, setDurationMinutes] = useState(
    booking.durationMinutes,
  )

  // Normalized like the quote page: no past dates, only start times left that day (README D-21).
  const now = businessNow()
  const room = rooms.find((candidate) => candidate.id === roomId) ?? rooms.at(0)
  const date = selectedDate >= now.date ? selectedDate : now.date
  const startTimes = startTimeOptions(date, now)
  const startTime = startTimes.includes(selectedStart)
    ? selectedStart
    : startTimes.at(0)

  const request =
    room && startTime
      ? { roomId: room.id, date, startTime, durationMinutes }
      : undefined
  const quote = useQuery(quoteQueryOptions(request))
  // A placeholder quote still describes the previous selection.
  const currentQuote =
    request && !quote.isPlaceholderData ? quote.data : undefined
  const canSave = Boolean(currentQuote?.available) && !save.isPending

  const submit = () => {
    if (!request || !canSave) return
    save.mutate(request, { onSuccess: onSaved })
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section
        aria-labelledby="schedule-title"
        className="min-w-0 flex-[999_1_560px] rounded-2xl border border-line bg-white p-7"
      >
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="flex flex-col gap-1">
            <h2 id="schedule-title" className="m-0 text-xl font-bold">
              Room &amp; schedule
            </h2>
            <p className="m-0 text-sm text-muted">
              Prefilled from your quote. Any change is checked and priced again.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="booking-room" className="text-sm font-semibold">
              Room
            </label>
            <select
              id="booking-room"
              value={room?.id ?? ''}
              onChange={(event) => setRoomId(event.target.value)}
              aria-describedby={room ? 'booking-room-info' : undefined}
              className={fieldClass}
            >
              <RoomOptions rooms={rooms} />
            </select>
            {room && (
              <p
                id="booking-room-info"
                className="m-0 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted"
              >
                <span>
                  Size:{' '}
                  <strong className="text-ink">{SIZE_LABELS[room.size]}</strong>
                </span>
                <span>
                  Rate:{' '}
                  <span className="font-mono text-ink">
                    {formatCop(room.hourlyRate)} / hour
                  </span>
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-[1_1_200px]">
              <DateField
                id="booking-date"
                label="Date"
                value={date}
                min={now.date}
                className={fieldClass}
                onChange={setSelectedDate}
              />
            </div>
            <div className="flex flex-[1_1_160px] flex-col gap-2">
              <label htmlFor="booking-start" className="text-sm font-semibold">
                Start time
              </label>
              <select
                id="booking-start"
                value={startTime ?? ''}
                disabled={startTimes.length === 0}
                onChange={(event) => setSelectedStart(event.target.value)}
                className={`${fieldClass} font-mono disabled:bg-canvas disabled:text-muted`}
              >
                {startTimes.length === 0 && (
                  <option value="">No times left</option>
                )}
                {startTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-[1_1_160px] flex-col gap-2">
              <label
                htmlFor="booking-duration"
                className="text-sm font-semibold"
              >
                Duration
              </label>
              <select
                id="booking-duration"
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(Number(event.target.value))
                }
                className={`${fieldClass} font-mono`}
              >
                {DURATIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {formatHours(minutes)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Availability
            hasRequest={Boolean(request)}
            quote={currentQuote}
            errorMessage={
              quote.error
                ? bookingErrorMessage(
                    quote.error,
                    'The quote could not be calculated. Please try again.',
                  )
                : undefined
            }
            onUseSuggestion={setSelectedStart}
          />

          {save.error && (
            <p
              role="alert"
              className="m-0 rounded-[10px] border border-danger/30 bg-danger-tint px-3.5 py-3 text-sm text-danger"
            >
              {bookingErrorMessage(save.error)}
            </p>
          )}

          <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line-strong bg-white px-5 text-[15px] font-semibold text-ink"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!canSave}
              aria-busy={save.isPending}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-6 text-[15px] font-bold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save and continue
            </button>
          </div>
        </form>
      </section>

      <aside
        aria-labelledby="price-title"
        aria-busy={quote.isFetching}
        className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-2xl border border-line bg-white p-6"
      >
        <h2 id="price-title" className="m-0 text-base font-bold">
          Price
        </h2>
        {quote.data && request ? (
          <PriceBreakdown
            price={quote.data.price}
            durationMinutes={quote.data.durationMinutes}
            hourlyRate={quote.data.room.hourlyRate}
          />
        ) : (
          <p role="status" className="m-0 text-sm text-muted">
            {request
              ? 'Calculating the price…'
              : 'Pick a date with start times left to see a price.'}
          </p>
        )}
        {booking.price.services.length > 0 && (
          <p className="m-0 text-[13px] leading-normal text-muted">
            The room price only: the services you picked are added in the next
            step.
          </p>
        )}
      </aside>
    </div>
  )
}

function Availability({
  hasRequest,
  quote,
  errorMessage,
  onUseSuggestion,
}: {
  hasRequest: boolean
  quote: Quote | undefined
  errorMessage: string | undefined
  onUseSuggestion: (startTime: string) => void
}) {
  if (!hasRequest) {
    return (
      <p role="status" className="m-0 text-sm text-muted">
        There are no start times left that day. Pick another date.
      </p>
    )
  }
  if (errorMessage) {
    return (
      <p
        role="alert"
        className="m-0 rounded-xl bg-danger-tint px-4 py-3.5 text-sm text-danger"
      >
        {errorMessage}
      </p>
    )
  }
  if (!quote) {
    return (
      <p role="status" className="m-0 text-sm text-muted">
        Checking availability…
      </p>
    )
  }

  const end = parseTime(quote.startTime) + quote.durationMinutes
  if (quote.available) {
    return (
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
        <p className="m-0 text-sm leading-snug">
          <strong>Available.</strong> {quote.room.name} is free on{' '}
          {formatDateLabel(quote.date)} from {quote.startTime} to{' '}
          {formatMinute(end)}.
        </p>
      </div>
    )
  }

  const { suggestion } = quote
  return (
    <div
      role="status"
      className="flex gap-3 rounded-xl bg-warning-tint px-4 py-3.5 text-warning"
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
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="m-0 font-bold">Not available</p>
        <p className="mt-1 mb-0 text-sm leading-snug">
          {quote.reason?.message}
        </p>
        {suggestion && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-sm">Next free slot that day:</span>
            <button
              type="button"
              onClick={() => onUseSuggestion(suggestion.startTime)}
              className="min-h-11 rounded-[10px] border border-warning bg-white px-4 font-mono text-sm font-medium text-warning"
            >
              Use {suggestion.startTime}–{suggestion.endTime}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
