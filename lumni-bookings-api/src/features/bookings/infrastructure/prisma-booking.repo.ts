import { Inject, Injectable } from "@nestjs/common";
// The same implementation `db.ts` installs as the global `Temporal` the timestamptz codec uses.
import { Temporal } from "temporal-polyfill";

import { PrismaService } from "../../../prisma.service";
import type { Transaction } from "../../../shared/application/unit-of-work";
import { EXCLUSION_VIOLATION, isDatabaseError } from "../../../shared/infrastructure/database-error";
import { toCents, toNumeric } from "../../../shared/infrastructure/numeric";
import { ormOf } from "../../../shared/infrastructure/prisma-unit-of-work";
import type { BookingStatus } from "../domain/core/booking-status";
import { Booking, type BookingStep, type NewBooking } from "../domain/entities/booking";
import { SlotTakenError } from "../domain/exceptions";
import { BookingRepository, type BookedInterval } from "../domain/repos/booking.repo";

// Statuses that block a slot (D-04).
const BLOCKING_STATUSES = ["confirmed", "completed"] as const;

const BOOKING_FIELDS = [
  "id",
  "customerId",
  "roomId",
  "startsAt",
  "endsAt",
  "status",
  "total",
  "quotedAt",
  "currentStep",
  "confirmedAt",
  "cancellationReason",
  "createdAt",
] as const;

interface BookingRow {
  id: unknown;
  customerId: unknown;
  roomId: unknown;
  startsAt: Temporal.Instant;
  endsAt: Temporal.Instant;
  status: BookingStatus;
  total: unknown;
  quotedAt: Temporal.Instant;
  currentStep: number;
  confirmedAt: Temporal.Instant | null;
  cancellationReason: string | null;
  /** `timestamptz-string` codec: the timestamp as Postgres writes it, such as `2024-01-02 03:04:05.678+00`. */
  createdAt: string;
}

@Injectable()
export class PrismaBookingRepository extends BookingRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findBlockingIntervals(roomId: string, from: Date, to: Date, tx?: Transaction): Promise<BookedInterval[]> {
    const rows = await ormOf(this.prisma, tx)
      .public.Booking.select("startsAt", "endsAt")
      .where({ roomId })
      .where((b) => b.status.in([...BLOCKING_STATUSES]))
      .where((b) => b.startsAt.lt(toInstant(to)))
      .where((b) => b.endsAt.gt(toInstant(from)))
      .all();

    return rows.map((row) => ({
      startsAt: toDate(row.startsAt),
      endsAt: toDate(row.endsAt),
    }));
  }

  async create(booking: NewBooking, tx: Transaction): Promise<Booking> {
    const row = await ormOf(this.prisma, tx)
      .public.Booking.select(...BOOKING_FIELDS)
      .create({
        customerId: booking.customerId,
        roomId: booking.roomId,
        startsAt: toInstant(booking.startsAt),
        endsAt: toInstant(booking.endsAt),
        status: booking.status,
        total: toNumeric(booking.totalCents),
        quotedAt: toInstant(booking.quotedAt),
        currentStep: booking.currentStep,
        confirmedAt: booking.confirmedAt ? toInstant(booking.confirmedAt) : null,
      });
    return toBooking(row);
  }

  async findById(id: string, tx?: Transaction): Promise<Booking | null> {
    const row = await ormOf(this.prisma, tx).public.Booking.select(...BOOKING_FIELDS).where({ id }).first();
    return row ? toBooking(row) : null;
  }

  async findByCustomer(customerId: string, tx?: Transaction): Promise<Booking[]> {
    // The id (uuidv7, time-ordered) breaks ties between bookings created in the same instant.
    const rows = await ormOf(this.prisma, tx)
      .public.Booking.select(...BOOKING_FIELDS)
      .where({ customerId })
      .orderBy([(b) => b.createdAt.desc(), (b) => b.id.desc()])
      .all();
    return rows.map(toBooking);
  }

  async lockById(id: string, tx: Transaction): Promise<Booking | null> {
    // `FOR NO KEY UPDATE` serializes writers of the booking without blocking the foreign-key checks
    // of its lines and services (prisma-8, queries-postgres pitfall 13).
    const row = await ormOf(this.prisma, tx)
      .public.Booking.select(...BOOKING_FIELDS)
      .where({ id })
      .forNoKeyUpdate()
      .first();
    return row ? toBooking(row) : null;
  }

  async save(booking: Booking, tx: Transaction): Promise<boolean> {
    try {
      const row = await ormOf(this.prisma, tx)
        .public.Booking.where({ id: booking.id, status: "draft" })
        .select("id")
        .update({
          roomId: booking.roomId,
          startsAt: toInstant(booking.startsAt),
          endsAt: toInstant(booking.endsAt),
          status: booking.status,
          total: toNumeric(booking.totalCents),
          quotedAt: toInstant(booking.quotedAt),
          currentStep: booking.currentStep,
          confirmedAt: booking.confirmedAt ? toInstant(booking.confirmedAt) : null,
        });
      return row !== null;
    } catch (error) {
      // The D-05 exclusion constraint: another blocking booking of the room overlaps this one.
      if (isDatabaseError(error, EXCLUSION_VIOLATION)) throw new SlotTakenError();
      throw error;
    }
  }
}

function toInstant(date: Date): Temporal.Instant {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime());
}

function toDate(instant: Temporal.Instant): Date {
  return new Date(instant.epochMilliseconds);
}

function toBooking(row: BookingRow): Booking {
  return Booking.restore({
    id: String(row.id),
    customerId: String(row.customerId),
    roomId: String(row.roomId),
    startsAt: toDate(row.startsAt),
    endsAt: toDate(row.endsAt),
    status: row.status,
    totalCents: toCents(row.total),
    quotedAt: toDate(row.quotedAt),
    currentStep: row.currentStep as BookingStep,
    confirmedAt: row.confirmedAt ? toDate(row.confirmedAt) : null,
    cancellationReason: row.cancellationReason ?? null,
    // Temporal parses the Postgres text form (space separator, hour-only offset) exactly.
    createdAt: toDate(Temporal.Instant.from(row.createdAt)),
  });
}
