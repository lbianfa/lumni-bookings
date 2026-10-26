import { Module } from "@nestjs/common";

import { CustomerRepository } from "./domain/repos/customer.repo";
import { PrismaCustomerRepository } from "./infrastructure/prisma-customer.repo";

// Internal module: no HTTP; bookings reads and updates the customer through the exported repository.
@Module({
  providers: [{ provide: CustomerRepository, useClass: PrismaCustomerRepository }],
  exports: [CustomerRepository],
})
export class CustomersModule {}
