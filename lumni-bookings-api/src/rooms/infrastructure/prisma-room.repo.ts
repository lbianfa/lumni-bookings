import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma.service";
import type { Room, RoomSize } from "../domain/entities/room";
import { RoomRepository } from "../domain/repos/room.repo";

const SIZE_ORDER: Record<RoomSize, number> = { small: 0, medium: 1, large: 2 };

/** Exact cents from a `numeric(14,2)` value, without going through a float. */
function toCents(amount: string): number {
  const [whole, fraction = ""] = amount.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

@Injectable()
export class PrismaRoomRepository extends RoomRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  private get rooms() {
    return this.prisma.db.orm.public.Room.select("id", "name", "size", "hourlyRate", "capacity");
  }

  async findById(id: string): Promise<Room | null> {
    const row = await this.rooms.where({ id }).first();
    return row ? toRoom(row) : null;
  }

  async list(): Promise<Room[]> {
    const rows = await this.rooms.orderBy((r) => r.name.asc()).all();
    return rows.map(toRoom).sort((a, b) => SIZE_ORDER[a.size] - SIZE_ORDER[b.size]);
  }
}

function toRoom(row: { id: unknown; name: string; size: RoomSize; hourlyRate: unknown; capacity: number }): Room {
  return {
    id: String(row.id),
    name: row.name,
    size: row.size,
    hourlyRateCents: toCents(String(row.hourlyRate)),
    capacity: row.capacity,
  };
}
