import { Module } from "@nestjs/common";

import { BookingRepository } from "./domain/repos/booking.repo";
import { PrismaBookingRepository } from "./infrastructure/prisma-booking.repo";

// For now only the booking repository, exported for the quote's availability check.
// The multi-step booking flow will add its use cases and HTTP layer here.
@Module({
  providers: [{ provide: BookingRepository, useClass: PrismaBookingRepository }],
  exports: [BookingRepository],
})
export class BookingsModule {}
