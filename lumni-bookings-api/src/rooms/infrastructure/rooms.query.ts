import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma.service";
import { RoomResponseDto } from "../http/dtos/room-response.dto";

const SIZE_ORDER = { small: 0, medium: 1, large: 2 } as const;

@Injectable()
export class RoomsQuery {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Every room, ordered by size (small first) and then by name. */
  async list(): Promise<RoomResponseDto[]> {
    const rows = await this.prisma.db.orm.public.Room.select("id", "name", "size", "hourlyRate", "capacity")
      .orderBy((r) => r.name.asc())
      .all();

    return rows
      .map((row) =>
        RoomResponseDto.from({
          id: String(row.id),
          name: row.name,
          size: row.size,
          hourlyRate: String(row.hourlyRate),
          capacity: row.capacity,
        }),
      )
      .sort((a, b) => SIZE_ORDER[a.size] - SIZE_ORDER[b.size]);
  }
}
