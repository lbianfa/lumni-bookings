import { Inject, Injectable } from "@nestjs/common";

import { Clock } from "../../shared/domain/clock";
import { checkAvailability, type Availability } from "../domain/availability";
import { BookingRepository } from "../domain/booking-repository";
import { SATURDAY, dayOfWeek, toInstant } from "../domain/business-time";
import { calculatePrice, type Price } from "../domain/price";
import { RoomNotFoundError, RoomRepository, type Room } from "../domain/room";
import { TimeSlot } from "../domain/time-slot";

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

  async execute(input: QuoteRoomInput): Promise<Quote> {
    const slot = TimeSlot.create(input.date, input.startMinute, input.durationMinutes);
    const room = await this.rooms.findById(input.roomId);
    if (!room) throw new RoomNotFoundError();

    const booked = await this.bookings.findBlockingIntervals(
      room.id,
      toInstant(slot.date, 0),
      toInstant(slot.date, 24 * 60),
    );
    const price = calculatePrice(room.hourlyRateCents, slot.durationMinutes, dayOfWeek(slot.date) === SATURDAY);

    return { room, slot, price, ...checkAvailability(slot, this.clock.now(), booked) };
  }
}
