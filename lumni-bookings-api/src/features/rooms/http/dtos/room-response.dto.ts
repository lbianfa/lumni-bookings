import { z } from "zod";

import { formatAmount } from "../../../../shared/http/money";
import { amountSchema } from "../../../../shared/http/openapi";
import type { Room, RoomSize } from "../../domain/entities/room";

const roomResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  size: z.enum(["small", "medium", "large"]),
  hourlyRate: amountSchema,
  capacity: z.int(),
});

/** The room as quotes and bookings show it. */
export const roomSummarySchema = roomResponseSchema.omit({ capacity: true });

// Whitelists the fields sent to clients; `schema` documents them (the class must keep matching it).
export class RoomResponseDto implements z.infer<typeof roomResponseSchema> {
  static readonly schema = roomResponseSchema;

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
