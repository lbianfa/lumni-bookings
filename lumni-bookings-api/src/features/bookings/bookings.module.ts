import { Module } from "@nestjs/common";

import { AuthModule } from "../../auth/auth.module";
import { BookingLinesModule } from "../booking-lines/booking-lines.module";
import { BookingServicesModule } from "../booking-services/booking-services.module";
import { CustomersModule } from "../customers/customers.module";
import { QuoteRoom } from "../quotes/application/quote-room.use-case";
import { RoomsModule } from "../rooms/rooms.module";
import { ServicesModule } from "../services/services.module";
import { UnitOfWork } from "../../shared/application/unit-of-work";
import { Clock } from "../../shared/domain/clock";
import { PrismaUnitOfWork } from "../../shared/infrastructure/prisma-unit-of-work";
import { SystemClock } from "../../shared/infrastructure/system-clock";
import { BookingAccess } from "./application/helpers/booking-access";
import { BookingDetailsReader } from "./application/helpers/booking-details";
import { BookingQuoter } from "./application/helpers/booking-quoter";
import { ConfirmBooking } from "./application/confirm-booking.use-case";
import { GetBooking } from "./application/get-booking.use-case";
import { SaveCustomerDetails } from "./application/save-customer-details.use-case";
import { SaveSchedule } from "./application/save-schedule.use-case";
import { SaveServices } from "./application/save-services.use-case";
import { StartBooking } from "./application/start-booking.use-case";
import { BookingRepository } from "./domain/repos/booking.repo";
import { BookingsController } from "./http/bookings.controller";
import { PrismaBookingRepository } from "./infrastructure/prisma-booking.repo";

// Owns the booking flow; the internal modules provide the repositories of its parts.
// Keeps exporting the booking repository for the quote's availability check.
@Module({
  imports: [AuthModule, RoomsModule, CustomersModule, ServicesModule, BookingLinesModule, BookingServicesModule],
  controllers: [BookingsController],
  providers: [
    { provide: BookingRepository, useClass: PrismaBookingRepository },
    // Provided here, not imported: QuotesModule imports this module, so importing it back would be a module cycle.
    QuoteRoom,
    { provide: Clock, useClass: SystemClock },
    { provide: UnitOfWork, useClass: PrismaUnitOfWork },
    BookingAccess,
    BookingQuoter,
    BookingDetailsReader,
    StartBooking,
    GetBooking,
    SaveCustomerDetails,
    SaveSchedule,
    SaveServices,
    ConfirmBooking,
  ],
  exports: [BookingRepository],
})
export class BookingsModule {}
