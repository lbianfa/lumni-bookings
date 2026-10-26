import { Inject, Injectable } from "@nestjs/common";

import type { Transaction } from "../../../shared/application/unit-of-work";
import { Clock } from "../../../shared/domain/clock";
import { checkAvailability, type Availability } from "../domain/core/availability";
import { BookingRepository } from "../../bookings/domain/repos/booking.repo";
import { SATURDAY, dayOfWeek, toInstant } from "../domain/core/business-time";
import { calculatePrice, type Price } from "../domain/core/price";
import type { Room } from "../../rooms/domain/entities/room";
import { RoomNotFoundError } from "../domain/exceptions";
import { RoomRepository } from "../../rooms/domain/repos/room.repo";
import { TimeSlot } from "../domain/core/time-slot";

export interface QuoteRoomInput {
  readonly roomId: string;
  /** Business date, `YYYY-MM-DD`. */
  readonly date: string;
  /** Minutes after midnight. */
  readonly startMinute: number;
  readonly durationMinutes: number;
}

export interface Quote extends Availability {
  readonly room: Room;
  readonly slot: TimeSlot;
  readonly price: Price;
}

@Injectable()
export class QuoteRoom {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(BookingRepository) private readonly bookings: BookingRepository,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  /** Pass `tx` when quoting inside an open unit of work, so the reads share its connection. */
  async execute(input: QuoteRoomInput, tx?: Transaction): Promise<Quote> {
    const slot = TimeSlot.create(input.date, input.startMinute, input.durationMinutes);
    const room = await this.rooms.findById(input.roomId, tx);
    if (!room) throw new RoomNotFoundError();

    const booked = await this.bookings.findBlockingIntervals(
      room.id,
      toInstant(slot.date, 0),
      toInstant(slot.date, 24 * 60),
      tx,
    );
    const price = calculatePrice(room.hourlyRateCents, slot.durationMinutes, dayOfWeek(slot.date) === SATURDAY);

    return { room, slot, price, ...checkAvailability(slot, this.clock.now(), booked) };
  }
}
