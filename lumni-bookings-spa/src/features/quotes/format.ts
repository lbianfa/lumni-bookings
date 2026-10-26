import type { RoomSize } from '../rooms/room.types'

const copFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

/** `COP 160,000` for the API's decimal string `"160000.00"`. */
export function formatCop(amount: string): string {
  return `COP ${copFormat.format(Number(amount))}`
}

/** `4 h` or `4.5 h`. */
export function formatHours(minutes: number): string {
  return `${minutes / 60} h`
}

export const SIZE_LABELS: Record<RoomSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
}
