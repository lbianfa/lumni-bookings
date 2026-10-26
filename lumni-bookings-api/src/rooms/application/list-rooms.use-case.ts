import { Inject, Injectable } from "@nestjs/common";

import type { Room } from "../domain/entities/room";
import { RoomRepository } from "../domain/repos/room.repo";

@Injectable()
export class ListRooms {
  constructor(@Inject(RoomRepository) private readonly rooms: RoomRepository) {}

  /** Every room, ordered by size (small first) and then by name. */
  execute(): Promise<Room[]> {
    return this.rooms.list();
  }
}
