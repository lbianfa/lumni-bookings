import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { ApiError } from '../../../../api/http-client'
import { BookingRecord } from '../../../../features/bookings/components/booking-record'
import { bookingErrorMessage } from '../../../../features/bookings/errors'
import { adminBookingQueryOptions } from '../../../../features/bookings/queries'

// Any customer's booking, read-only. Reached by its URL until the admin's bookings table exists.
export const Route = createFileRoute(
  '/_authenticated/admin/bookings/$bookingId',
)({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(
        adminBookingQueryOptions(params.bookingId),
      )
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound()
      throw error
    }
  },
  component: AdminBookingPage,
  notFoundComponent: AdminBookingNotFound,
  errorComponent: AdminBookingError,
})

function AdminBookingPage() {
  const { bookingId } = Route.useParams()
  const { data: booking } = useSuspenseQuery(
    adminBookingQueryOptions(bookingId),
  )
  return <BookingRecord booking={booking} />
}

const LOAD_FAILED = 'The booking could not be loaded. Please try again.'

function AdminBookingNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0 text-[32px] leading-tight font-bold tracking-[-0.02em]">
        Booking not found
      </h1>
      <p className="m-0 max-w-[640px] text-base leading-normal text-muted">
        No booking has this reference.
      </p>
    </div>
  )
}

function AdminBookingError({ error }: ErrorComponentProps) {
  return (
    <p
      role="alert"
      className="m-0 max-w-[640px] rounded-xl bg-danger-tint px-4 py-3.5 text-sm text-danger"
    >
      {error instanceof Error
        ? bookingErrorMessage(error, LOAD_FAILED)
        : LOAD_FAILED}
    </p>
  )
}
