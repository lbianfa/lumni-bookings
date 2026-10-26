import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ApiError } from '../../api/http-client'
import { bookingErrorMessage } from '../../bookings/errors'
import { useStartBookingMutation } from '../../bookings/queries'
import {
  businessNow,
  formatDateLabel,
  formatMinute,
  parseTime,
  startTimeOptions,
} from '../../quotes/business-time'
import { QuoteRequestPanel } from '../../quotes/components/quote-request-panel'
import { QuoteSummary } from '../../quotes/components/quote-summary'
import { SIZE_LABELS } from '../../quotes/format'
import { quoteQueryOptions } from '../../quotes/queries'
import type { QuoteRequest } from '../../quotes/quote.types'
import { roomsQueryOptions } from '../../rooms/queries'

const DEFAULT_DURATION_MINUTES = 4 * 60

export const Route = createFileRoute('/_authenticated/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(roomsQueryOptions),
  component: QuotePage,
})

function errorMessage(error: Error) {
  if (error instanceof ApiError && error.status < 500) return error.message
  return 'The quote could not be calculated. Please try again.'
}

function sameRequest(a: QuoteRequest | undefined, b: QuoteRequest | undefined) {
  return (
    a?.roomId === b?.roomId &&
    a?.date === b?.date &&
    a?.startTime === b?.startTime &&
    a?.durationMinutes === b?.durationMinutes
  )
}

function QuotePage() {
  const { data: rooms } = useSuspenseQuery(roomsQueryOptions)
  const navigate = Route.useNavigate()
  const startBooking = useStartBookingMutation()
  // Unset choices fall back to the defaults below.
  const [roomId, setRoomId] = useState<string>()
  const [selectedDate, setSelectedDate] = useState<string>()
  const [selectedStart, setSelectedStart] = useState<string>()
  const [durationMinutes, setDurationMinutes] = useState(
    DEFAULT_DURATION_MINUTES,
  )

  // Normalized on every render, so a choice that time has made stale falls back:
  // no past dates, only start times left that day (README D-21).
  const now = businessNow()
  const room = rooms.find((candidate) => candidate.id === roomId) ?? rooms.at(0)
  const date =
    selectedDate && selectedDate >= now.date ? selectedDate : now.date
  const startTimes = startTimeOptions(date, now)
  const startTime =
    selectedStart && startTimes.includes(selectedStart)
      ? selectedStart
      : startTimes.at(0)

  const request =
    room && startTime
      ? { roomId: room.id, date, startTime, durationMinutes }
      : undefined
  const quote = useQuery(quoteQueryOptions(request))

  const start = () => {
    if (!request) return
    startBooking.mutate(request, {
      onSuccess: (booking) =>
        navigate({
          to: '/bookings/$bookingId',
          params: { bookingId: booking.id },
        }),
    })
  }
  // A failure only describes the selection it was made for.
  const startError =
    startBooking.error && sameRequest(startBooking.variables, request)
      ? bookingErrorMessage(
          startBooking.error,
          'The booking could not be started. Please try again.',
        )
      : undefined

  return (
    <>
      <div className="mb-7 flex flex-col gap-2">
        <h1 className="m-0 text-4xl leading-tight font-bold tracking-[-0.02em]">
          Quote a room
        </h1>
        <p className="m-0 max-w-[640px] text-base leading-normal text-muted">
          Pick a room, a day and a time. Price and availability are calculated
          by the booking rules, so what you see is what you pay.
        </p>
      </div>

      {!room ? (
        <p role="status" className="m-0 text-base text-muted">
          There are no rooms to quote yet.
        </p>
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <QuoteRequestPanel
            rooms={rooms}
            room={room}
            date={date}
            minDate={now.date}
            startTime={startTime}
            startTimes={startTimes}
            durationMinutes={durationMinutes}
            onRoomChange={setRoomId}
            onDateChange={setSelectedDate}
            onStartTimeChange={setSelectedStart}
            onDurationChange={setDurationMinutes}
          />
          <QuoteSummary
            heading={describeSelection(
              `${room.name} (${SIZE_LABELS[room.size]})`,
              date,
              startTime,
              durationMinutes,
            )}
            quote={request ? quote.data : undefined}
            pendingMessage={
              request
                ? 'Calculating the price…'
                : 'Pick a date with start times left to see a quote.'
            }
            isUpdating={quote.isFetching}
            errorMessage={quote.error ? errorMessage(quote.error) : undefined}
            onUseSuggestion={setSelectedStart}
            onStartBooking={start}
            isStartingBooking={startBooking.isPending}
            startBookingError={startError}
          />
        </div>
      )}
    </>
  )
}

function describeSelection(
  roomLabel: string,
  date: string,
  startTime: string | undefined,
  durationMinutes: number,
) {
  const day = `${roomLabel} · ${formatDateLabel(date)}`
  if (!startTime) return day
  const end = parseTime(startTime) + durationMinutes
  return `${day} · ${startTime}–${end < 24 * 60 ? formatMinute(end) : 'next day'}`
}
