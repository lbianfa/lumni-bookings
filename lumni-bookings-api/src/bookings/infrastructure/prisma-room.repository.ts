import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma.service";
import { RoomRepository, type Room } from "../domain/room";

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

  async findById(id: string): Promise<Room | null> {
    const row = await this.prisma.db.orm.public.Room.select("id", "name", "size", "hourlyRate").where({ id }).first();
    if (!row) return null;

    return { id: String(row.id), name: row.name, size: row.size, hourlyRateCents: toCents(String(row.hourlyRate)) };
  }
}
