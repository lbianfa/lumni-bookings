import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma.service";
import { UnitOfWork, type Transaction } from "../application/unit-of-work";

type Db = PrismaService["db"];
type PrismaTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

@Injectable()
export class PrismaUnitOfWork extends UnitOfWork {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  run<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.prisma.db.transaction((tx) => work(tx as unknown as Transaction));
  }
}

/** The ORM to query with: the transaction's when the caller runs inside one, the client's otherwise. */
export function ormOf(prisma: PrismaService, tx?: Transaction): Db["orm"] {
  return tx ? ((tx as unknown as PrismaTransaction).orm as Db["orm"]) : prisma.db.orm;
}
