import type { QuoteRequest } from '../quotes/quote.types'
import type { RoomSize } from '../rooms/room.types'

export type BookingStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'

export type BookingStep = 1 | 2 | 3

/** Room, date, start time and duration: the same body as a quote request. */
export type BookingSchedule = QuoteRequest

export interface BookingCustomer {
  fullName: string
  email: string
  company: string | null
}

export interface BookingService {
  id: string
  code: string
  name: string
  /** COP, decimal string with two places. */
  price: string
  selected: boolean
}

export interface Booking {
  id: string
  /** `BK-<id>`. */
  reference: string
  status: BookingStatus
  /** The furthest step reached, where a reopened draft resumes. */
  currentStep: BookingStep
  customer: BookingCustomer
  room: { id: string; name: string; size: RoomSize; hourlyRate: string }
  /** Business date, `YYYY-MM-DD`. */
  date: string
  /** `HH:mm`. */
  startTime: string
  /** `HH:mm`. */
  endTime: string
  durationMinutes: number
  startsAt: string
  endsAt: string
  price: {
    base: string
    discountPercent: number
    discount: string
    surchargePercent: number
    surcharge: string
    services: { code: string; name: string; price: string }[]
    total: string
  }
  services: BookingService[]
  quotedAt: string
  confirmedAt: string | null
  /** When the draft was started. */
  createdAt: string
}

/** One row of `GET /api/my-bookings`: the session customer's bookings, newest first. */
export interface BookingListItem {
  id: string
  /** `BK-<id>`. */
  reference: string
  status: BookingStatus
  /** The furthest step reached, where a reopened draft resumes. */
  currentStep: BookingStep
  room: { id: string; name: string; size: RoomSize }
  /** Business date, `YYYY-MM-DD`. */
  date: string
  /** `HH:mm`. */
  startTime: string
  /** `HH:mm`. */
  endTime: string
  /** COP, decimal string with two places. */
  total: string
  /** The selected services, in catalog order. */
  services: { code: string; name: string }[]
  cancellationReason: string | null
  createdAt: string
}

/** One row of `GET /api/bookings` (the admin's list): a My bookings item plus whose booking it is. */
export interface AdminBookingListItem extends BookingListItem {
  customer: { id: string; fullName: string }
}

/** One page of `GET /api/bookings`, newest created first. */
export interface BookingPage {
  items: AdminBookingListItem[]
  /** From 1. */
  page: number
  pageSize: number
  /** Bookings matching the filters, on every page. */
  total: number
  /** At least 1. */
  totalPages: number
}

/** The admin list's filters; an absent field does not filter. */
export interface BookingFilters {
  status?: BookingStatus
  roomId?: string
}

export type EmailStatus = 'pending' | 'sent' | 'failed'

/** One send attempt of an email. */
export interface EmailAttempt {
  /** ISO timestamp. */
  attemptedAt: string
  outcome: 'sent' | 'failed'
  /** Why the provider did not take it; null when sent. */
  error: string | null
}

/** `GET /api/bookings/:id/email` (admin only): the booking's confirmation email. */
export interface BookingEmail {
  type: 'booking_confirmation'
  status: EmailStatus
  toAddress: string
  subject: string
  /** Attempts made; emails queued before the history was kept list none. */
  attemptCount: number
  lastError: string | null
  /** ISO timestamp, once sent. */
  sentAt: string | null
  /** Oldest first. */
  attempts: EmailAttempt[]
}
