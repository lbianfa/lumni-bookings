import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { ApiError, httpClient } from '../../api/http-client'
import type {
  Booking,
  BookingCustomer,
  BookingEmail,
  BookingFilters,
  BookingListItem,
  BookingPage,
  BookingSchedule,
} from './booking.types'

function bookingPath(bookingId: string) {
  return `/bookings/${encodeURIComponent(bookingId)}`
}

async function fetchBooking(bookingId: string): Promise<Booking> {
  const { data } = await httpClient.get<Booking>(
    `/my-bookings/${encodeURIComponent(bookingId)}`,
  )
  return data
}

// No retries: a 404 must show the not-found state right away.
export function bookingQueryOptions(bookingId: string) {
  return queryOptions({
    queryKey: ['bookings', bookingId],
    queryFn: () => fetchBooking(bookingId),
    retry: false,
  })
}

// Any customer's booking, read by the admin. Its own key keeps it apart from the customer's cache.
// No retries: a 404 must show the not-found state right away.
export function adminBookingQueryOptions(bookingId: string) {
  return queryOptions({
    queryKey: ['admin', 'bookings', bookingId],
    queryFn: async () => {
      const { data } = await httpClient.get<Booking>(bookingPath(bookingId))
      return data
    },
    retry: false,
  })
}

const PENDING_EMAIL_REFRESH_MS = 5000

// The booking's confirmation email, for the admin: null when the booking has none (404), such as a draft.
// While it is pending, it is read again so the box shows the send's outcome without a reload.
export function adminBookingEmailQueryOptions(bookingId: string) {
  return queryOptions({
    queryKey: ['admin', 'bookings', bookingId, 'email'],
    queryFn: async (): Promise<BookingEmail | null> => {
      try {
        const { data } = await httpClient.get<BookingEmail>(
          `${bookingPath(bookingId)}/email`,
        )
        return data
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? PENDING_EMAIL_REFRESH_MS : false,
  })
}

// One page of every customer's bookings, for the admin's table. The previous page stays on screen
// while the next one loads, so the table does not flash empty between pages or filters.
export function adminBookingsQueryOptions(
  filters: BookingFilters,
  page: number,
) {
  return queryOptions({
    queryKey: ['admin', 'bookings', 'list', filters, page],
    queryFn: async () => {
      const { data } = await httpClient.get<BookingPage>('/bookings', {
        params: { ...filters, page },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

// The session customer's bookings (My bookings). No retries: a 403 (a user without a
// customer, such as the admin) must show its message right away.
export const myBookingsQueryOptions = queryOptions({
  queryKey: ['bookings'],
  queryFn: async () => {
    const { data } = await httpClient.get<BookingListItem[]>('/my-bookings')
    return data
  },
  retry: false,
})

// Exact: the detail keys (`['bookings', id]`) share the prefix and are updated from the response.
function invalidateMyBookings(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: myBookingsQueryOptions.queryKey,
    exact: true,
  })
}

export function useStartBookingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (schedule: BookingSchedule) => {
      const { data } = await httpClient.post<Booking>('/bookings', schedule)
      return data
    },
    onSuccess: (booking) => {
      queryClient.setQueryData(
        bookingQueryOptions(booking.id).queryKey,
        booking,
      )
      void invalidateMyBookings(queryClient)
    },
  })
}

// Every step answers with the whole booking, which replaces the cached one.
// A 409 means the booking changed elsewhere (e.g. confirmed in another tab), so it is read again.
function useBookingUpdate<TBody>(
  bookingId: string,
  send: (path: string, body: TBody) => Promise<Booking>,
) {
  const queryClient = useQueryClient()
  const { queryKey } = bookingQueryOptions(bookingId)
  return useMutation({
    mutationFn: (body: TBody) => send(bookingPath(bookingId), body),
    onSuccess: (booking) => {
      queryClient.setQueryData(queryKey, booking)
      void invalidateMyBookings(queryClient)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey })
      }
    },
  })
}

export function useSaveCustomerMutation(bookingId: string) {
  return useBookingUpdate(
    bookingId,
    async (path, customer: BookingCustomer) =>
      (await httpClient.put<Booking>(`${path}/customer`, customer)).data,
  )
}

export function useSaveScheduleMutation(bookingId: string) {
  return useBookingUpdate(
    bookingId,
    async (path, schedule: BookingSchedule) =>
      (await httpClient.put<Booking>(`${path}/schedule`, schedule)).data,
  )
}

export function useSaveServicesMutation(bookingId: string) {
  return useBookingUpdate(
    bookingId,
    async (path, serviceIds: string[]) =>
      (await httpClient.put<Booking>(`${path}/services`, { serviceIds })).data,
  )
}

export function useConfirmBookingMutation(bookingId: string) {
  return useBookingUpdate(
    bookingId,
    async (path, _body: void) =>
      (await httpClient.post<Booking>(`${path}/confirm`)).data,
  )
}
