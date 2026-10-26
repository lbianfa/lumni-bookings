import { DomainError } from "../../shared/domain/domain-error";

export class RoomNotFoundError extends DomainError {
  constructor() {
    super("Room not found");
  }
}

export class InvalidTimeSlotError extends DomainError {}
