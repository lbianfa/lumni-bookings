import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";

import { PrismaModule } from "./prisma.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [AppController],
})
export class AppModule {}
