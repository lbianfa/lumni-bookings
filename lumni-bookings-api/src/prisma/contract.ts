import { defineContract, enumType, member } from '@prisma/orm-postgres/contract-builder';

const UserRole = enumType(
  'UserRole',
  { codecId: 'pg/text@1', nativeType: 'text' },
  member('Customer', 'customer'),
  member('Admin', 'admin'),
);

const RoomSize = enumType(
  'RoomSize',
  { codecId: 'pg/text@1', nativeType: 'text' },
  member('Small', 'small'),
  member('Medium', 'medium'),
  member('Large', 'large'),
);

const BookingStatus = enumType(
  'BookingStatus',
  { codecId: 'pg/text@1', nativeType: 'text' },
  member('Draft', 'draft'),
  member('Confirmed', 'confirmed'),
  member('Completed', 'completed'),
  member('Cancelled', 'cancelled'),
);

export const contract = defineContract(
  { enums: { UserRole, RoomSize, BookingStatus } },
  ({ field, model, rel, type }) => {
    const Customer = model('Customer', {
      fields: {
        id: field.id.uuidv7String(),
        email: field.text().unique(),
        fullName: field.text(),
        company: field.text().optional(),
        createdAt: field.temporal.createdAtString(),
        updatedAt: field.temporal.updatedAtString(),
      },
    });

    // One customer per user: the customer role links to its own customer row
    const User = model('User', {
      fields: {
        id: field.id.uuidv7String(),
        email: field.text().unique(),
        passwordHash: field.text(),
        role: field.namedType(UserRole),
        customerId: field.uuidString().optional().unique(),
        createdAt: field.temporal.createdAtString(),
        updatedAt: field.temporal.updatedAtString(),
      },
      relations: {
        customer: rel.belongsTo(Customer, { from: 'customerId', to: 'id' }).sql({ fk: { onDelete: 'restrict' } }),
      },
    });

    // Additional services with a flat price per booking (D-14)
    const Service = model('Service', {
      fields: {
        id: field.id.uuidv7String(),
        code: field.text().unique(),
        name: field.text(),
        price: field.column(type.Numeric(14, 2)),
        createdAt: field.temporal.createdAtString(),
        updatedAt: field.temporal.updatedAtString(),
      },
    });

    const Room = model('Room', {
      fields: {
        id: field.id.uuidv7String(),
        name: field.text().unique(),
        size: field.namedType(RoomSize),
        // Money is numeric(14,2) in COP (D-13)
        hourlyRate: field.column(type.Numeric(14, 2)),
        capacity: field.int(),
        createdAt: field.temporal.createdAtString(),
        updatedAt: field.temporal.updatedAtString(),
      },
    });

    // The D-05 exclusion constraint is not expressible here: it lives as rawSql in the migrations.
    const Booking = model('Booking', {
      fields: {
        id: field.id.uuidv7String(),
        customerId: field.uuidString(),
        roomId: field.uuidString(),
        startsAt: field.temporal.timestamptz(),
        endsAt: field.temporal.timestamptz(),
        status: field.namedType(BookingStatus),
        // Quoted price (D-18): frozen once confirmed (D-06)
        total: field.column(type.Numeric(14, 2)),
        quotedAt: field.temporal.timestamptz(),
        // Furthest step of the 3-step form reached, to resume the draft
        currentStep: field.int().default(1),
        cancellationReason: field.text().optional(),
        confirmedAt: field.temporal.timestamptz().optional(),
        cancelledAt: field.temporal.timestamptz().optional(),
        createdAt: field.temporal.createdAtString(),
        updatedAt: field.temporal.updatedAtString(),
      },
      relations: {
        customer: rel.belongsTo(Customer, { from: 'customerId', to: 'id' }).sql({ fk: { onDelete: 'restrict' } }),
        room: rel.belongsTo(Room, { from: 'roomId', to: 'id' }).sql({ fk: { onDelete: 'restrict' } }),
      },
    });

    // Price breakdown snapshot: base, discount, surcharge and each service; amounts are signed and add up to the total
    const BookingLine = model('BookingLine', {
      fields: {
        id: field.id.uuidv7String(),
        bookingId: field.uuidString(),
        concept: field.text(),
        amount: field.column(type.Numeric(14, 2)),
        createdAt: field.temporal.createdAtString(),
      },
      relations: {
        booking: rel.belongsTo(Booking, { from: 'bookingId', to: 'id' }).sql({ fk: { onDelete: 'restrict' } }),
      },
    });

    const BookingService = model('BookingService', {
      fields: {
        bookingId: field.uuidString(),
        serviceId: field.uuidString(),
        createdAt: field.temporal.createdAtString(),
      },
      relations: {
        booking: rel.belongsTo(Booking, { from: 'bookingId', to: 'id' }).sql({ fk: { onDelete: 'restrict' } }),
        service: rel.belongsTo(Service, { from: 'serviceId', to: 'id' }).sql({ fk: { onDelete: 'restrict' } }),
      },
    }).attributes(({ fields, constraints }) => ({
      id: constraints.id([fields.bookingId, fields.serviceId]),
    }));

    return {
      models: { Customer, User, Room, Service, Booking, BookingLine, BookingService },
    };
  },
);
