import { Inject, Injectable } from "@nestjs/common";

import type { BookingLine } from "../../../booking-lines/domain/entities/booking-line";
import { BookingLineRepository } from "../../../booking-lines/domain/repos/booking-line.repo";
import { BookingServiceRepository } from "../../../booking-services/domain/repos/booking-service.repo";
import type { Customer } from "../../../customers/domain/entities/customer";
import { RoomNotFoundError } from "../../../quotes/domain/exceptions";
import type { Room } from "../../../rooms/domain/entities/room";
import { RoomRepository } from "../../../rooms/domain/repos/room.repo";
import type { Service } from "../../../services/domain/entities/service";
import { ServiceRepository } from "../../../services/domain/repos/service.repo";
import type { Transaction } from "../../../../shared/application/unit-of-work";
import type { Booking } from "../../domain/entities/booking";

/** Everything the booking pages show: the booking, its parts and the services catalog for step 3. */
export interface BookingDetails {
  readonly booking: Booking;
  readonly customer: Customer;
  readonly room: Room;
  /** The quoted breakdown; frozen once confirmed (D-06). */
  readonly lines: readonly BookingLine[];
  /** The whole catalog, at current prices. */
  readonly services: readonly Service[];
  readonly selectedServiceIds: readonly string[];
}

@Injectable()
export class BookingDetailsReader {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(BookingLineRepository) private readonly lines: BookingLineRepository,
    @Inject(BookingServiceRepository) private readonly bookingServices: BookingServiceRepository,
    @Inject(ServiceRepository) private readonly services: ServiceRepository,
  ) {}

  /** Pass the open transaction after a write, so the details include it. */
  async read(booking: Booking, customer: Customer, tx?: Transaction): Promise<BookingDetails> {
    const room = await this.rooms.findById(booking.roomId, tx);
    if (!room) throw new RoomNotFoundError();

    return {
      booking,
      customer,
      room,
      lines: await this.lines.findByBooking(booking.id, tx),
      services: await this.services.list(tx),
      selectedServiceIds: await this.bookingServices.findServiceIds(booking.id, tx),
    };
  }
}
