import { Inject, Injectable } from "@nestjs/common";

import type { Customer } from "../../customers/domain/entities/customer";
import { CustomerRepository } from "../../customers/domain/repos/customer.repo";
import { UnitOfWork } from "../../../shared/application/unit-of-work";
import { BookingNotEditableError } from "../domain/exceptions";
import { BookingRepository } from "../domain/repos/booking.repo";
import { BookingAccess } from "./helpers/booking-access";
import { BookingDetailsReader, type BookingDetails } from "./helpers/booking-details";

export interface CustomerDetailsInput {
  readonly fullName: string;
  readonly email: string;
  readonly company: string | null;
}

/** Step 1: saves the user's customer details, which the booking references. */
@Injectable()
export class SaveCustomerDetails {
  constructor(
    @Inject(BookingAccess) private readonly access: BookingAccess,
    @Inject(CustomerRepository) private readonly customers: CustomerRepository,
    @Inject(BookingRepository) private readonly bookings: BookingRepository,
    @Inject(BookingDetailsReader) private readonly details: BookingDetailsReader,
    @Inject(UnitOfWork) private readonly unitOfWork: UnitOfWork,
  ) {}

  execute(userId: string, bookingId: string, input: CustomerDetailsInput): Promise<BookingDetails> {
    return this.unitOfWork.run(async (tx) => {
      const { customer, booking } = await this.access.lock(userId, bookingId, tx);
      booking.completeStep(1);

      const updated: Customer = { ...customer, ...input };
      await this.customers.update(updated, tx);
      if (!(await this.bookings.save(booking, tx))) throw new BookingNotEditableError();
      return this.details.read(booking, updated, tx);
    });
  }
}
