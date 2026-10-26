import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { SessionGuard } from "../../../auth/http/session.guard";
import { ApiError } from "../../../shared/http/openapi";
import { ListRooms } from "../application/list-rooms.use-case";
import { RoomResponseDto } from "./dtos/room-response.dto";

@Controller("rooms")
@UseGuards(SessionGuard)
@ApiTags("rooms")
@ApiCookieAuth()
export class RoomsController {
  constructor(@Inject(ListRooms) private readonly listRooms: ListRooms) {}

  @Get()
  @ApiOperation({ summary: "List the rooms with their hourly rate (D-22)" })
  @ApiOkResponse({ description: "Every room", standardSchema: RoomResponseDto.schema.array() })
  @ApiError(401, "No valid session cookie")
  async list(): Promise<RoomResponseDto[]> {
    return (await this.listRooms.execute()).map(RoomResponseDto.from);
  }
}
