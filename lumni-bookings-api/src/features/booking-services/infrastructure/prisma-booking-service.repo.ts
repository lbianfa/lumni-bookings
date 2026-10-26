import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../../../prisma.service";
import type { Transaction } from "../../../shared/application/unit-of-work";
import { ormOf } from "../../../shared/infrastructure/prisma-unit-of-work";
import { BookingServiceRepository } from "../domain/repos/booking-service.repo";

@Injectable()
export class PrismaBookingServiceRepository extends BookingServiceRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findServiceIds(bookingId: string, tx?: Transaction): Promise<string[]> {
    const rows = await ormOf(this.prisma, tx).public.BookingService.select("serviceId").where({ bookingId }).all();
    return rows.map((row) => String(row.serviceId));
  }

  async replace(bookingId: string, serviceIds: readonly string[], tx: Transaction): Promise<void> {
    const orm = ormOf(this.prisma, tx);
    await orm.public.BookingService.where({ bookingId }).deleteAll();
    for (const serviceId of serviceIds) {
      await orm.public.BookingService.create({ bookingId, serviceId });
    }
  }
}
