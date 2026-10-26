import type { RoomSize } from '../rooms/room.types'

export interface QuoteRequest {
  roomId: string
  /** Business date, `YYYY-MM-DD`. */
  date: string
  /** `HH:mm`, on the 30-minute grid. */
  startTime: string
  durationMinutes: number
}

export type UnavailabilityCode =
  'closed_day' | 'outside_opening_hours' | 'in_the_past' | 'room_booked'

export interface Quote {
  room: { id: string; name: string; size: RoomSize; hourlyRate: string }
  date: string
  startTime: string
  durationMinutes: number
  startsAt: string
  endsAt: string
  price: {
    base: string
    discountPercent: number
    discount: string
    surchargePercent: number
    surcharge: string
    total: string
  }
  available: boolean
  reason: { code: UnavailabilityCode; message: string } | null
  suggestion: { startTime: string; endTime: string } | null
}
