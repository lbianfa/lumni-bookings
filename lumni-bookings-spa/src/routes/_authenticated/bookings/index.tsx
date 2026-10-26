import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { BookingListItem } from '../../../features/bookings/components/booking-list-item'
import { bookingErrorMessage } from '../../../features/bookings/errors'
import { myBookingsQueryOptions } from '../../../features/bookings/queries'

export const Route = createFileRoute('/_authenticated/bookings/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(myBookingsQueryOptions),
  component: MyBookingsPage,
  errorComponent: MyBookingsError,
})

function MyBookingsHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h1 className="m-0 text-[32px] leading-tight font-bold tracking-[-0.02em]">
        My bookings
      </h1>
      <Link
        to="/quote"
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-[18px] text-sm font-bold text-white no-underline hover:bg-brand-strong"
      >
        New quote
      </Link>
    </div>
  )
}

function MyBookingsPage() {
  const { data: bookings } = useSuspenseQuery(myBookingsQueryOptions)

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6">
      <MyBookingsHeader />
      {bookings.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {bookings.map((booking) => (
            <BookingListItem key={booking.id} booking={booking} />
          ))}
        </ul>
      ) : (
        <div className="rounded-[14px] border border-line bg-white p-5">
          <p className="m-0 font-bold">You have no bookings yet.</p>
          <p className="mt-1 mb-0 text-sm leading-normal text-muted">
            Start with a new quote: pick a room and a time, then book it.
          </p>
        </div>
      )}
    </div>
  )
}

const LOAD_FAILED = 'Your bookings could not be loaded. Please try again.'

function loadErrorMessage(error: unknown): string {
  return error instanceof Error
    ? bookingErrorMessage(error, LOAD_FAILED)
    : LOAD_FAILED
}

function MyBookingsError({ error }: ErrorComponentProps) {
  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6">
      <MyBookingsHeader />
      <p
        role="alert"
        className="m-0 rounded-xl bg-danger-tint px-4 py-3.5 text-sm text-danger"
      >
        {loadErrorMessage(error)}
      </p>
    </div>
  )
}
