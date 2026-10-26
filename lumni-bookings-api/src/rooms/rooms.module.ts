import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { RoomsController } from "./http/rooms.controller";
import { RoomsQuery } from "./infrastructure/rooms.query";

@Module({
  imports: [AuthModule],
  controllers: [RoomsController],
  providers: [RoomsQuery],
})
export class RoomsModule {}
