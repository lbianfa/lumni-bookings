import { Controller, Get, Inject, UseGuards } from "@nestjs/common";

import { SessionGuard } from "../../auth/http/session.guard";
import { ListRooms } from "../application/list-rooms.use-case";
import { RoomResponseDto } from "./dtos/room-response.dto";

@Controller("rooms")
@UseGuards(SessionGuard)
export class RoomsController {
  constructor(@Inject(ListRooms) private readonly listRooms: ListRooms) {}

  @Get()
  async list(): Promise<RoomResponseDto[]> {
    return (await this.listRooms.execute()).map(RoomResponseDto.from);
  }
}
