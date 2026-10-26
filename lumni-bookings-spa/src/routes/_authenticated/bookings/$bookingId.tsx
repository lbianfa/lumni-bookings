import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { ApiError } from '../../../api/http-client'
import { BackToQuoteLink } from '../../../bookings/components/back-to-quote-link'
import { BookingRecord } from '../../../bookings/components/booking-record'
import { BookingWizard } from '../../../bookings/components/booking-wizard'
import { bookingErrorMessage } from '../../../bookings/errors'
import { bookingQueryOptions } from '../../../bookings/queries'
import { roomsQueryOptions } from '../../../rooms/queries'

export const Route = createFileRoute('/_authenticated/bookings/$bookingId')({
  loader: async ({ context, params }) => {
    try {
      await Promise.all([
        context.queryClient.ensureQueryData(
          bookingQueryOptions(params.bookingId),
        ),
        // Step 2 lists every room.
        context.queryClient.ensureQueryData(roomsQueryOptions),
      ])
    } catch (error) {
      // Another customer's booking is also a 404, so it looks like a missing one.
      if (error instanceof ApiError && error.status === 404) throw notFound()
      throw error
    }
  },
  component: BookingPage,
  notFoundComponent: BookingNotFound,
  errorComponent: BookingError,
})

function BookingPage() {
  const { bookingId } = Route.useParams()
  const { data: booking } = useSuspenseQuery(bookingQueryOptions(bookingId))

  // Only drafts can be edited; any other status is shown read-only.
  return booking.status === 'draft' ? (
    <BookingWizard key={booking.id} booking={booking} />
  ) : (
    <BookingRecord booking={booking} />
  )
}

const LOAD_FAILED = 'The booking could not be loaded. Please try again.'

function BookingNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <BackToQuoteLink />
      <h1 className="m-0 text-[32px] leading-tight font-bold tracking-[-0.02em]">
        Booking not found
      </h1>
      <p className="m-0 max-w-[640px] text-base leading-normal text-muted">
        This booking does not exist or belongs to another account. Start a new
        one from a quote.
      </p>
    </div>
  )
}

function BookingError({ error }: ErrorComponentProps) {
  return (
    <div className="flex flex-col gap-4">
      <BackToQuoteLink />
      <p
        role="alert"
        className="m-0 max-w-[640px] rounded-xl bg-danger-tint px-4 py-3.5 text-sm text-danger"
      >
        {error instanceof Error
          ? bookingErrorMessage(error, LOAD_FAILED)
          : LOAD_FAILED}
      </p>
    </div>
  )
}
