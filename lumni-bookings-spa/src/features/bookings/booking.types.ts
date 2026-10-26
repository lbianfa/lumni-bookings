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
}
