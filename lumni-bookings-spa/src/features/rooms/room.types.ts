export type RoomSize = 'small' | 'medium' | 'large'

export interface Room {
  id: string
  name: string
  size: RoomSize
  /** COP per hour, decimal string with two places. */
  hourlyRate: string
  capacity: number
}
