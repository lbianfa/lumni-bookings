import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma.service";
import type { Transaction } from "../../shared/application/unit-of-work";
import { UNIQUE_VIOLATION, isDatabaseError } from "../../shared/infrastructure/database-error";
import { ormOf } from "../../shared/infrastructure/prisma-unit-of-work";
import type { Customer } from "../domain/entities/customer";
import { CustomerEmailTakenError } from "../domain/exceptions";
import { CustomerRepository } from "../domain/repos/customer.repo";

@Injectable()
export class PrismaCustomerRepository extends CustomerRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findByUserId(userId: string, tx?: Transaction): Promise<Customer | null> {
    const user = await ormOf(this.prisma, tx).public.User.select("customerId").where({ id: userId }).first();
    return user?.customerId ? this.findById(String(user.customerId), tx) : null;
  }

  async findById(id: string, tx?: Transaction): Promise<Customer | null> {
    const row = await ormOf(this.prisma, tx)
      .public.Customer.select("id", "email", "fullName", "company")
      .where({ id })
      .first();
    return row
      ? { id: String(row.id), email: row.email, fullName: row.fullName, company: row.company ?? null }
      : null;
  }

  async update(customer: Customer, tx?: Transaction): Promise<void> {
    try {
      await ormOf(this.prisma, tx)
        .public.Customer.where({ id: customer.id })
        .update({ email: customer.email, fullName: customer.fullName, company: customer.company });
    } catch (error) {
      if (isDatabaseError(error, UNIQUE_VIOLATION)) throw new CustomerEmailTakenError();
      throw error;
    }
  }
}
