import { Inject, Injectable } from "@nestjs/common";
// The same implementation `db.ts` installs as the global `Temporal` the timestamptz codec uses.
import { Temporal } from "temporal-polyfill";

import { PrismaService } from "../../prisma.service";
import { BookingRepository, type BookedInterval } from "../domain/repos/booking.repo";

// Statuses that block a slot (D-04).
const BLOCKING_STATUSES = ["confirmed", "completed"] as const;

@Injectable()
export class PrismaBookingRepository extends BookingRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findBlockingIntervals(roomId: string, from: Date, to: Date): Promise<BookedInterval[]> {
    const rows = await this.prisma.db.orm.public.Booking.select("startsAt", "endsAt")
      .where({ roomId })
      .where((b) => b.status.in([...BLOCKING_STATUSES]))
      .where((b) => b.startsAt.lt(Temporal.Instant.fromEpochMilliseconds(to.getTime())))
      .where((b) => b.endsAt.gt(Temporal.Instant.fromEpochMilliseconds(from.getTime())))
      .all();

    return rows.map((row) => ({
      startsAt: new Date(row.startsAt.epochMilliseconds),
      endsAt: new Date(row.endsAt.epochMilliseconds),
    }));
  }
}
