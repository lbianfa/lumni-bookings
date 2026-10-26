import { RoomOptions } from '../../rooms/components/room-options'
import type { Room } from '../../rooms/room.types'
import { MAX_DURATION_MINUTES, MIN_DURATION_MINUTES } from '../business-time'
import { SIZE_LABELS, formatCop, formatHours } from '../format'
import { DateField } from './date-field'

const fieldClass =
  'min-h-12 rounded-[10px] border border-line-strong bg-white px-3 text-[15px] text-ink'

interface QuoteRequestPanelProps {
  rooms: Room[]
  room: Room
  date: string
  minDate: string
  startTime: string | undefined
  startTimes: string[]
  durationMinutes: number
  onRoomChange: (roomId: string) => void
  onDateChange: (date: string) => void
  onStartTimeChange: (startTime: string) => void
  onDurationChange: (durationMinutes: number) => void
}

export function QuoteRequestPanel({
  rooms,
  room,
  date,
  minDate,
  startTime,
  startTimes,
  durationMinutes,
  onRoomChange,
  onDateChange,
  onStartTimeChange,
  onDurationChange,
}: QuoteRequestPanelProps) {
  return (
    <section
      aria-labelledby="request-title"
      className="flex min-w-0 flex-[999_1_560px] flex-col gap-7 rounded-2xl border border-line bg-white p-7"
    >
      <h2 id="request-title" className="m-0 text-xl font-bold">
        Your request
      </h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="quote-room" className="text-sm font-semibold">
          Room
        </label>
        <select
          id="quote-room"
          value={room.id}
          onChange={(event) => onRoomChange(event.target.value)}
          aria-describedby="quote-room-info"
          className={fieldClass}
        >
          <RoomOptions rooms={rooms} />
        </select>
        <p
          id="quote-room-info"
          className="m-0 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted"
        >
          <span>
            Size: <strong className="text-ink">{SIZE_LABELS[room.size]}</strong>
          </span>
          <span>
            Rate:{' '}
            <span className="font-mono text-ink">
              {formatCop(room.hourlyRate)} / hour
            </span>
          </span>
          <span>
            Capacity:{' '}
            <strong className="text-ink">{room.capacity} people</strong>
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-[1_1_200px]">
          <DateField
            id="quote-date"
            label="Date"
            value={date}
            min={minDate}
            className={fieldClass}
            onChange={onDateChange}
          />
        </div>
        <div className="flex flex-[1_1_160px] flex-col gap-2">
          <label htmlFor="quote-start" className="text-sm font-semibold">
            Start time
          </label>
          <select
            id="quote-start"
            value={startTime ?? ''}
            disabled={startTimes.length === 0}
            onChange={(event) => onStartTimeChange(event.target.value)}
            aria-describedby={
              startTimes.length === 0 ? 'quote-start-empty' : undefined
            }
            className={`${fieldClass} font-mono disabled:bg-canvas disabled:text-muted`}
          >
            {startTimes.length === 0 && <option value="">No times left</option>}
            {startTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {startTimes.length === 0 && (
            <p id="quote-start-empty" className="m-0 text-[13px] text-muted">
              There are no start times left today. Pick another date.
            </p>
          )}
        </div>
        <div className="flex flex-[1_1_200px] flex-col gap-2">
          <span id="quote-duration-label" className="text-sm font-semibold">
            Duration
          </span>
          <div
            role="group"
            aria-labelledby="quote-duration-label"
            className="flex min-h-12 items-center overflow-hidden rounded-[10px] border border-line-strong bg-white"
          >
            <button
              type="button"
              aria-label="Decrease duration by 30 minutes"
              disabled={durationMinutes <= MIN_DURATION_MINUTES}
              onClick={() => onDurationChange(durationMinutes - 30)}
              className="inline-flex size-12 items-center justify-center text-ink disabled:text-line-strong"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
              </svg>
            </button>
            <output
              aria-live="polite"
              className="flex-1 text-center font-mono text-[15px] font-medium"
            >
              {formatHours(durationMinutes)}
            </output>
            <button
              type="button"
              aria-label="Increase duration by 30 minutes"
              disabled={durationMinutes >= MAX_DURATION_MINUTES}
              onClick={() => onDurationChange(durationMinutes + 30)}
              className="inline-flex size-12 items-center justify-center text-ink disabled:text-line-strong"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-7 gap-y-3 border-t border-line pt-5 text-[13px] leading-normal text-muted">
        <span>Monday to Saturday, 07:00–21:00 · Closed on Sundays</span>
        <span>1 to 10 hours, in 30-minute blocks</span>
        <span>10% off from 4 h · 20% off from 8 h</span>
        <span>+25% on Saturdays, applied after the discount</span>
      </div>
    </section>
  )
}
