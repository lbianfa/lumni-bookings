import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { BookingsModule } from "../bookings/bookings.module";
import { RoomsModule } from "../rooms/rooms.module";
import { Clock } from "../shared/domain/clock";
import { SystemClock } from "../shared/infrastructure/system-clock";
import { QuoteRoom } from "./application/quote-room.use-case";
import { QuotesController } from "./http/quotes.controller";

@Module({
  // RoomsModule and BookingsModule provide the room and booking repositories the quote reads.
  imports: [AuthModule, RoomsModule, BookingsModule],
  controllers: [QuotesController],
  providers: [
    QuoteRoom,
    { provide: Clock, useClass: SystemClock },
  ],
})
export class QuotesModule {}
