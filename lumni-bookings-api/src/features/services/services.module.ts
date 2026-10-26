import { Module } from "@nestjs/common";

import { ServiceRepository } from "./domain/repos/service.repo";
import { PrismaServiceRepository } from "./infrastructure/prisma-service.repo";

// Internal module: no HTTP; bookings reads the additional services catalog through the exported repository.
@Module({
  providers: [{ provide: ServiceRepository, useClass: PrismaServiceRepository }],
  exports: [ServiceRepository],
})
export class ServicesModule {}
