import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { Clock } from "../shared/domain/clock";
import { SystemClock } from "../shared/infrastructure/system-clock";
import { QuoteRoom } from "./application/quote-room.use-case";
import { BookingRepository } from "./domain/booking-repository";
import { RoomRepository } from "./domain/room";
import { QuotesController } from "./http/quotes.controller";
import { PrismaBookingRepository } from "./infrastructure/prisma-booking.repository";
import { PrismaRoomRepository } from "./infrastructure/prisma-room.repository";

@Module({
  imports: [AuthModule],
  controllers: [QuotesController],
  providers: [
    QuoteRoom,
    { provide: RoomRepository, useClass: PrismaRoomRepository },
    { provide: BookingRepository, useClass: PrismaBookingRepository },
    { provide: Clock, useClass: SystemClock },
  ],
})
export class BookingsModule {}
