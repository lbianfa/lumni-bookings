import { SIZE_LABELS, formatCop } from '../../quotes/format'
import type { Room, RoomSize } from '../room.types'

const SIZES: RoomSize[] = ['small', 'medium', 'large']

/** The `<option>`s of a room `<select>`, grouped by size with each size's hourly rate. */
export function RoomOptions({ rooms }: { rooms: Room[] }) {
  return SIZES.map((size) => {
    const group = rooms.filter((candidate) => candidate.size === size)
    if (group.length === 0) return null
    return (
      <optgroup
        key={size}
        label={`${SIZE_LABELS[size]} · ${formatCop(group[0].hourlyRate)} / hour`}
      >
        {group.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.name}
          </option>
        ))}
      </optgroup>
    )
  })
}
