// Business time is America/Bogota: UTC-5 all year, no daylight saving time (D-02).
// A fixed offset is therefore exact and needs no time zone database.
const OFFSET = "-05:00";
const OFFSET_MS = -5 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export const SUNDAY = 0;
export const SATURDAY = 6;

/** The instant of `minute` minutes after midnight of a business `date` (`YYYY-MM-DD`). */
export function toInstant(date: string, minute: number): Date {
  return new Date(new Date(`${date}T00:00:00${OFFSET}`).getTime() + minute * MINUTE_MS);
}

/** Minutes from the start of the business `date` to `instant`. */
export function minutesSinceStartOf(date: string, instant: Date): number {
  return (instant.getTime() - toInstant(date, 0).getTime()) / MINUTE_MS;
}

/** Day of the week of a business date: 0 is Sunday, 6 is Saturday. */
export function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** The business date (`YYYY-MM-DD`) an instant falls on. */
export function businessDateOf(instant: Date): string {
  return new Date(instant.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** `HH:mm` for a minute of the day. */
export function formatMinute(minute: number): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;
}
