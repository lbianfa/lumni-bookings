import { Controller, Get, Inject, UseGuards } from "@nestjs/common";

import { SessionGuard } from "../../auth/http/session.guard";
import { RoomsQuery } from "../infrastructure/rooms.query";
import type { RoomResponseDto } from "./dtos/room-response.dto";

@Controller("rooms")
@UseGuards(SessionGuard)
export class RoomsController {
  constructor(@Inject(RoomsQuery) private readonly rooms: RoomsQuery) {}

  @Get()
  list(): Promise<RoomResponseDto[]> {
    return this.rooms.list();
  }
}
