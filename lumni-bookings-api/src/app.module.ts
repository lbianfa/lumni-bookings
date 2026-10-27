import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { AppController } from "./app.controller";

import { AuthModule } from "./auth/auth.module";
import { BookingsModule } from "./features/bookings/bookings.module";
import { PrismaModule } from "./prisma.module";
import { QuotesModule } from "./features/quotes/quotes.module";
import { RoomsModule } from "./features/rooms/rooms.module";

@Module({
  // EventEmitterModule runs the in-process jobs, such as sending a queued email.
  imports: [EventEmitterModule.forRoot(), PrismaModule, AuthModule, RoomsModule, QuotesModule, BookingsModule],
  controllers: [AppController],
})
export class AppModule {}
