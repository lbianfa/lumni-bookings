// Business time is America/Bogota: UTC-5 all year, no daylight saving time (README D-02).
const OFFSET_MS = -5 * 60 * 60 * 1000

// Booking rules shown in the picker (CONTEXT §1.1). The API applies them again.
export const OPENING_MINUTE = 7 * 60
export const CLOSING_MINUTE = 21 * 60
export const SLOT_MINUTES = 30
export const MIN_DURATION_MINUTES = 60
export const MAX_DURATION_MINUTES = 600

/** The current business date (`YYYY-MM-DD`) and minute of the day. */
export function businessNow(now = new Date()): {
  date: string
  minute: number
} {
  const local = new Date(now.getTime() + OFFSET_MS)
  return {
    date: local.toISOString().slice(0, 10),
    minute: local.getUTCHours() * 60 + local.getUTCMinutes(),
  }
}

export function formatMinute(minute: number): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`
}

export function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Start times for a date: the opening hours on the 30-minute grid, leaving room
 * for the shortest booking; for today, only the ones not yet passed (README D-21).
 */
export function startTimeOptions(date: string, now = businessNow()): string[] {
  const times: string[] = []
  for (
    let minute = OPENING_MINUTE;
    minute + MIN_DURATION_MINUTES <= CLOSING_MINUTE;
    minute += SLOT_MINUTES
  ) {
    // The current minute has already started, so it no longer counts as a future start.
    if (date === now.date && minute <= now.minute) continue
    times.push(formatMinute(minute))
  }
  return times
}

/** `Sat, Oct 31` for `2026-10-31`. */
export function formatDateLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
