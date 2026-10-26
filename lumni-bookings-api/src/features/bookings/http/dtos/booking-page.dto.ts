import { z } from "zod";

import type { BookingPage, CustomerBookingSummary } from "../../application/list-bookings.use-case";
import { BookingListItemDto, bookingListItemSchema } from "./booking-list-item.dto";

const adminBookingListItemSchema = bookingListItemSchema.extend({
  customer: z.object({ id: z.uuid(), fullName: z.string() }),
});

const bookingPageSchema = z.object({
  items: z.array(adminBookingListItemSchema).describe("Newest created first"),
  page: z.int().min(1),
  pageSize: z.int(),
  total: z.int().describe("Bookings matching the filters, on every page"),
  totalPages: z.int().min(1),
});

type AdminBookingListItem = z.infer<typeof adminBookingListItemSchema>;

// A My bookings item plus whose booking it is.
function itemOf(summary: CustomerBookingSummary): AdminBookingListItem {
  const { id, fullName } = summary.customer;
  return { ...BookingListItemDto.from(summary), customer: { id, fullName } };
}

// One page of the admin's booking list; `schema` documents it (the class must keep matching it).
export class BookingPageDto implements z.infer<typeof bookingPageSchema> {
  static readonly schema = bookingPageSchema;

  readonly items: AdminBookingListItem[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;

  private constructor({ items, page, pageSize, total, totalPages }: BookingPage) {
    this.items = items.map(itemOf);
    this.page = page;
    this.pageSize = pageSize;
    this.total = total;
    this.totalPages = totalPages;
  }

  static from(page: BookingPage): BookingPageDto {
    return new BookingPageDto(page);
  }
}
