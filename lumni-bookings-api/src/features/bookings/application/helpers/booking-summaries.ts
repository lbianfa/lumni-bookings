import { Inject, Injectable } from "@nestjs/common";

import { BookingServiceRepository } from "../../../booking-services/domain/repos/booking-service.repo";
import { RoomNotFoundError } from "../../../quotes/domain/exceptions";
import type { Room } from "../../../rooms/domain/entities/room";
import { RoomRepository } from "../../../rooms/domain/repos/room.repo";
import type { Service } from "../../../services/domain/entities/service";
import { ServiceRepository } from "../../../services/domain/repos/service.repo";
import type { Booking } from "../../domain/entities/booking";

/** One item of a booking list: the booking, its room and the services it selected. */
export interface BookingSummary {
  readonly booking: Booking;
  readonly room: Room;
  /** The selected services, in catalog order. */
  readonly services: readonly Service[];
}

// Shared by My bookings and the admin list. Rooms, services and selections are read once for the whole list,
// never per booking.
@Injectable()
export class BookingSummaries {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(ServiceRepository) private readonly services: ServiceRepository,
    @Inject(BookingServiceRepository) private readonly bookingServices: BookingServiceRepository,
  ) {}

  /** The summaries of `bookings`, in the same order. */
  async of(bookings: readonly Booking[]): Promise<BookingSummary[]> {
    if (bookings.length === 0) return [];

    const [rooms, catalog, selections] = await Promise.all([
      this.rooms.list(),
      this.services.list(),
      this.bookingServices.findServiceIdsByBookings(bookings.map((booking) => booking.id)),
    ]);
    const roomsById = new Map(rooms.map((room) => [room.id, room]));

    return bookings.map((booking) => {
      const room = roomsById.get(booking.roomId);
      if (!room) throw new RoomNotFoundError();
      const selected = selections.get(booking.id) ?? [];
      return { booking, room, services: catalog.filter((service) => selected.includes(service.id)) };
    });
  }
}
