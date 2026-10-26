import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";

import { AuthModule } from "./auth/auth.module";
import { BookingsModule } from "./bookings/bookings.module";
import { PrismaModule } from "./prisma.module";
import { RoomsModule } from "./rooms/rooms.module";

@Module({
  imports: [PrismaModule, AuthModule, RoomsModule, BookingsModule],
  controllers: [AppController],
})
export class AppModule {}
