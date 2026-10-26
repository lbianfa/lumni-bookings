import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";

import { AuthModule } from "./auth/auth.module";
import { BookingsModule } from "./features/bookings/bookings.module";
import { PrismaModule } from "./prisma.module";
import { QuotesModule } from "./features/quotes/quotes.module";
import { RoomsModule } from "./features/rooms/rooms.module";

@Module({
  imports: [PrismaModule, AuthModule, RoomsModule, QuotesModule, BookingsModule],
  controllers: [AppController],
})
export class AppModule {}
