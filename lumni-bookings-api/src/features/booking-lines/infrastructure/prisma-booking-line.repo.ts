import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../../../prisma.service";
import type { Transaction } from "../../../shared/application/unit-of-work";
import { toCents, toNumeric } from "../../../shared/infrastructure/numeric";
import { ormOf } from "../../../shared/infrastructure/prisma-unit-of-work";
import type { BookingLine } from "../domain/entities/booking-line";
import { BookingLineRepository } from "../domain/repos/booking-line.repo";

@Injectable()
export class PrismaBookingLineRepository extends BookingLineRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findByBooking(bookingId: string, tx?: Transaction): Promise<BookingLine[]> {
    // Ids are UUIDv7, so ordering by id keeps the order the lines were written in.
    const rows = await ormOf(this.prisma, tx)
      .public.BookingLine.select("concept", "amount")
      .where({ bookingId })
      .orderBy((l) => l.id.asc())
      .all();
    return rows.map((row) => ({ concept: row.concept, amountCents: toCents(row.amount) }));
  }

  async replace(bookingId: string, lines: readonly BookingLine[], tx: Transaction): Promise<void> {
    const orm = ormOf(this.prisma, tx);
    await orm.public.BookingLine.where({ bookingId }).deleteAll();
    for (const line of lines) {
      await orm.public.BookingLine.create({ bookingId, concept: line.concept, amount: toNumeric(line.amountCents) });
    }
  }
}
