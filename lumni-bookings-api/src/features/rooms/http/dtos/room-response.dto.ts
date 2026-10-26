import { formatAmount } from "../../../../shared/http/money";
import type { Room, RoomSize } from "../../domain/entities/room";

// Whitelists the fields sent to clients.
export class RoomResponseDto {
  readonly id: string;
  readonly name: string;
  readonly size: RoomSize;
  /** COP per hour, decimal string with two places (D-13). */
  readonly hourlyRate: string;
  readonly capacity: number;

  private constructor(room: Room) {
    this.id = room.id;
    this.name = room.name;
    this.size = room.size;
    this.hourlyRate = formatAmount(room.hourlyRateCents);
    this.capacity = room.capacity;
  }

  static from(room: Room): RoomResponseDto {
    return new RoomResponseDto(room);
  }
}
