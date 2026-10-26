import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma.service";
import type { Transaction } from "../../shared/application/unit-of-work";
import { toCents } from "../../shared/infrastructure/numeric";
import { ormOf } from "../../shared/infrastructure/prisma-unit-of-work";
import type { Service } from "../domain/entities/service";
import { ServiceRepository } from "../domain/repos/service.repo";

@Injectable()
export class PrismaServiceRepository extends ServiceRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async list(tx?: Transaction): Promise<Service[]> {
    const rows = await ormOf(this.prisma, tx)
      .public.Service.select("id", "code", "name", "price")
      .orderBy((s) => s.name.asc())
      .all();
    return rows.map((row) => ({ id: String(row.id), code: row.code, name: row.name, priceCents: toCents(row.price) }));
  }
}
