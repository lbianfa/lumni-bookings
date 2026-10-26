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
    const User = model('User', {
      fields: {
        id: field.id.uuidv7String(),
        email: field.text().unique(),
        passwordHash: field.text(),
        role: field.namedType(UserRole),
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

    // Minimal bookings table: the quote only needs it to check availability.
    // The booking flow extends it later; the D-05 exclusion constraint is added in the migration.
    const Booking = model('Booking', {
      fields: {
        id: field.id.uuidv7String(),
        roomId: field.uuidString(),
        startsAt: field.temporal.timestamptz(),
        endsAt: field.temporal.timestamptz(),
        status: field.namedType(BookingStatus),
        createdAt: field.temporal.createdAtString(),
        updatedAt: field.temporal.updatedAtString(),
      },
      relations: {
        room: rel.belongsTo(Room, { from: 'roomId', to: 'id' }).sql({ fk: { onDelete: 'restrict' } }),
      },
    });

    return {
      models: { User, Room, Booking },
    };
  },
);
