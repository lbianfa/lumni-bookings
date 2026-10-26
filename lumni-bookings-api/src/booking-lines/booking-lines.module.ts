import { Module } from "@nestjs/common";

import { BookingLineRepository } from "./domain/repos/booking-line.repo";
import { PrismaBookingLineRepository } from "./infrastructure/prisma-booking-line.repo";

// Internal module: no HTTP; bookings writes the price breakdown snapshot through the exported repository.
@Module({
  providers: [{ provide: BookingLineRepository, useClass: PrismaBookingLineRepository }],
  exports: [BookingLineRepository],
})
export class BookingLinesModule {}
