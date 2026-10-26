import { z } from "zod";

import { BOOKINGS_PAGE_SIZE } from "../../application/list-bookings.use-case";
import type { BookingFilter } from "../../domain/repos/booking.repo";

// The largest page whose offset, (page - 1) × page size, is still a safe integer the database driver accepts.
const MAX_PAGE = Math.floor(Number.MAX_SAFE_INTEGER / BOOKINGS_PAGE_SIZE) + 1;

// The admin list's query string; every parameter is optional.
export class BookingsQueryDto {
  static readonly schema = z.object({
    status: z.enum(["draft", "confirmed", "completed", "cancelled"]).optional(),
    roomId: z.uuid().optional(),
    page: z.coerce.number().int().min(1).max(MAX_PAGE).default(1),
  });

  readonly filter: BookingFilter;
  readonly page: number;

  constructor({ status, roomId, page }: z.infer<typeof BookingsQueryDto.schema>) {
    this.filter = { status, roomId };
    this.page = page;
  }
}
