import type { Transaction } from "../../../../shared/application/unit-of-work";
import type { Room } from "../entities/room";

// Port: the rooms list and the quote read rooms through it; tests replace it with an in-memory fake.
export abstract class RoomRepository {
  abstract findById(id: string, tx?: Transaction): Promise<Room | null>;
  /** Every room, ordered by size (small first) and then by name. */
  abstract list(): Promise<Room[]>;
}
