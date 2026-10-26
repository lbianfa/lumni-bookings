import { DomainError } from "../../shared/domain/domain-error";

export type RoomSize = "small" | "medium" | "large";

export interface Room {
  readonly id: string;
  readonly name: string;
  readonly size: RoomSize;
  readonly hourlyRateCents: number;
}

export class RoomNotFoundError extends DomainError {
  constructor() {
    super("Room not found");
  }
}

// Port: the quote reads the room's rate; tests replace it with an in-memory fake.
export abstract class RoomRepository {
  abstract findById(id: string): Promise<Room | null>;
}
