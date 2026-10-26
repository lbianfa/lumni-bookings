import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { ApiError, httpClient } from '../api/http-client'
import type { Booking, BookingCustomer, BookingSchedule } from './booking.types'

function bookingPath(bookingId: string) {
  return `/bookings/${encodeURIComponent(bookingId)}`
}

async function fetchBooking(bookingId: string): Promise<Booking> {
  const { data } = await httpClient.get<Booking>(bookingPath(bookingId))
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
