import { SIZE_LABELS } from '../../../quotes/format'
import type { Room, RoomSize } from '../../../rooms/room.types'
import type { BookingFilters, BookingStatus } from '../../booking.types'

const STATUS_OPTIONS: { value: BookingStatus | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const SIZES: RoomSize[] = ['small', 'medium', 'large']
const ALL_ROOMS = 'all'

interface BookingsFiltersProps {
  rooms: Room[]
  filters: BookingFilters
  onChange: (filters: BookingFilters) => void
}

export function BookingsFilters({
  rooms,
  filters,
  onChange,
}: BookingsFiltersProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div
        role="group"
        aria-label="Filter by status"
        className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-white p-1"
      >
        {STATUS_OPTIONS.map((option) => {
          const selected = filters.status === option.value
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange({ ...filters, status: option.value })}
              className={`min-h-10 rounded-[9px] px-3.5 text-sm ${
                selected
                  ? 'bg-ink font-semibold text-white'
                  : 'font-medium text-ink-soft hover:bg-canvas'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="flex min-w-[200px] flex-col gap-1.5">
        <label htmlFor="room-filter" className="text-[13px] font-semibold">
          Room
        </label>
        <select
          id="room-filter"
          value={filters.roomId ?? ALL_ROOMS}
          onChange={(event) =>
            onChange({
              ...filters,
              roomId:
                event.target.value === ALL_ROOMS
                  ? undefined
                  : event.target.value,
            })
          }
          className="min-h-11 rounded-[10px] border border-line-strong bg-white px-3 text-sm text-ink"
        >
          <option value={ALL_ROOMS}>All rooms</option>
          {SIZES.map((size) => (
            <optgroup key={size} label={SIZE_LABELS[size]}>
              {rooms
                .filter((room) => room.size === size)
                .map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  )
}
