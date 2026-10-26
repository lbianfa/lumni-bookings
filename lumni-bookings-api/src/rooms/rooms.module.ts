import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { ListRooms } from "./application/list-rooms.use-case";
import { RoomRepository } from "./domain/repos/room.repo";
import { RoomsController } from "./http/rooms.controller";
import { PrismaRoomRepository } from "./infrastructure/prisma-room.repo";

// Owns the room repository and exports it, so the quote reads rooms through it.
@Module({
  imports: [AuthModule],
  controllers: [RoomsController],
  providers: [ListRooms, { provide: RoomRepository, useClass: PrismaRoomRepository }],
  exports: [RoomRepository],
})
export class RoomsModule {}
