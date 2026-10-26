import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useState } from 'react'
import type { BookingFilters } from '../../../../features/bookings/booking.types'
import { BookingsFilters } from '../../../../features/bookings/components/admin/bookings-filters'
import { BookingsTable } from '../../../../features/bookings/components/admin/bookings-table'
import { PaginationBar } from '../../../../features/bookings/components/admin/pagination-bar'
import { bookingErrorMessage } from '../../../../features/bookings/errors'
import { adminBookingsQueryOptions } from '../../../../features/bookings/queries'
import { roomsQueryOptions } from '../../../../features/rooms/queries'

const NO_FILTERS: BookingFilters = {}

export const Route = createFileRoute('/_authenticated/admin/bookings/')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        adminBookingsQueryOptions(NO_FILTERS, 1),
      ),
      context.queryClient.ensureQueryData(roomsQueryOptions),
    ]),
  component: AdminBookingsPage,
  errorComponent: AdminBookingsError,
})

const LOAD_FAILED = 'The bookings could not be loaded. Please try again.'

function loadErrorMessage(error: unknown): string {
  return error instanceof Error
    ? bookingErrorMessage(error, LOAD_FAILED)
    : LOAD_FAILED
}

function Heading() {
  return (
    <h1 className="m-0 text-[32px] leading-tight font-bold tracking-[-0.02em]">
      Bookings
    </h1>
  )
}

function AdminBookingsPage() {
  const { data: rooms } = useSuspenseQuery(roomsQueryOptions)
  // Page selections stay in component state, not in the URL (SPA CLAUDE.md).
  const [filters, setFilters] = useState(NO_FILTERS)
  const [page, setPage] = useState(1)
  const bookings = useQuery(adminBookingsQueryOptions(filters, page))

  // Another filter is another list, so it starts again from its first page.
  const changeFilters = (next: BookingFilters) => {
    setFilters(next)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-5">
      <Heading />
      <BookingsFilters
        rooms={rooms}
        filters={filters}
        onChange={changeFilters}
      />
      {bookings.isError && (
        <p
          role="alert"
          className="m-0 rounded-xl bg-danger-tint px-4 py-3.5 text-sm text-danger"
        >
          {loadErrorMessage(bookings.error)}
        </p>
      )}
      {bookings.data && (
        <>
          <BookingsTable
            bookings={bookings.data.items}
            stale={bookings.isPlaceholderData}
          />
          <PaginationBar
            page={bookings.data.page}
            totalPages={bookings.data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}

function AdminBookingsError({ error }: ErrorComponentProps) {
  return (
    <div className="flex flex-col gap-5">
      <Heading />
      <p
        role="alert"
        className="m-0 rounded-xl bg-danger-tint px-4 py-3.5 text-sm text-danger"
      >
        {loadErrorMessage(error)}
      </p>
    </div>
  )
}
