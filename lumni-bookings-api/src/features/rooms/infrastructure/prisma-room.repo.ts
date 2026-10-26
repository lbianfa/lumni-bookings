import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../../../prisma.service";
import type { Transaction } from "../../../shared/application/unit-of-work";
import { toCents } from "../../../shared/infrastructure/numeric";
import { ormOf } from "../../../shared/infrastructure/prisma-unit-of-work";
import type { Room, RoomSize } from "../domain/entities/room";
import { RoomRepository } from "../domain/repos/room.repo";

const SIZE_ORDER: Record<RoomSize, number> = { small: 0, medium: 1, large: 2 };

@Injectable()
export class PrismaRoomRepository extends RoomRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  private rooms(tx?: Transaction) {
    return ormOf(this.prisma, tx).public.Room.select("id", "name", "size", "hourlyRate", "capacity");
  }

  async findById(id: string, tx?: Transaction): Promise<Room | null> {
    const row = await this.rooms(tx).where({ id }).first();
    return row ? toRoom(row) : null;
  }

  async list(): Promise<Room[]> {
    const rows = await this.rooms().orderBy((r) => r.name.asc()).all();
    return rows.map(toRoom).sort((a, b) => SIZE_ORDER[a.size] - SIZE_ORDER[b.size]);
  }
}

function toRoom(row: { id: unknown; name: string; size: RoomSize; hourlyRate: unknown; capacity: number }): Room {
  return {
    id: String(row.id),
    name: row.name,
    size: row.size,
    hourlyRateCents: toCents(row.hourlyRate),
    capacity: row.capacity,
  };
}
