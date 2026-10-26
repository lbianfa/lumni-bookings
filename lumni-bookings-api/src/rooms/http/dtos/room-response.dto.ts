export type RoomSize = "small" | "medium" | "large";

// Whitelists the fields sent to clients.
export class RoomResponseDto {
  readonly id: string;
  readonly name: string;
  readonly size: RoomSize;
  /** COP per hour, decimal string with two places (D-13). */
  readonly hourlyRate: string;
  readonly capacity: number;

  private constructor(room: RoomResponseDto) {
    this.id = room.id;
    this.name = room.name;
    this.size = room.size;
    this.hourlyRate = room.hourlyRate;
    this.capacity = room.capacity;
  }

  static from(room: RoomResponseDto): RoomResponseDto {
    return new RoomResponseDto(room);
  }
}
