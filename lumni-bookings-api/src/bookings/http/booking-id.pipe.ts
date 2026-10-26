import { HttpStatus, NotFoundException, type PipeTransform } from "@nestjs/common";
import { z } from "zod";

const bookingId = z.uuid();

// A malformed id cannot name a booking, so it answers 404 like an unknown one instead of reaching the database.
export class BookingIdPipe implements PipeTransform<unknown, string> {
  transform(value: unknown): string {
    const result = bookingId.safeParse(value);
    if (!result.success) {
      throw new NotFoundException({ statusCode: HttpStatus.NOT_FOUND, message: "Booking not found" });
    }
    return result.data;
  }
}
