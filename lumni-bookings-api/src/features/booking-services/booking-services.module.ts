import { Module } from "@nestjs/common";

import { BookingServiceRepository } from "./domain/repos/booking-service.repo";
import { PrismaBookingServiceRepository } from "./infrastructure/prisma-booking-service.repo";

// Internal module: no HTTP; bookings stores the selected additional services through the exported repository.
@Module({
  providers: [{ provide: BookingServiceRepository, useClass: PrismaBookingServiceRepository }],
  exports: [BookingServiceRepository],
})
export class BookingServicesModule {}
