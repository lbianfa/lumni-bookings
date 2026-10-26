import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";

import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma.module";
import { QuotesModule } from "./quotes/quotes.module";
import { RoomsModule } from "./rooms/rooms.module";

@Module({
  imports: [PrismaModule, AuthModule, RoomsModule, QuotesModule],
  controllers: [AppController],
})
export class AppModule {}
