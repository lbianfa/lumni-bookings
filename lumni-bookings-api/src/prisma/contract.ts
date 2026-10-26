import { defineContract, enumType, member } from '@prisma/orm-postgres/contract-builder';

const UserRole = enumType(
  'UserRole',
  { codecId: 'pg/text@1', nativeType: 'text' },
  member('Customer', 'customer'),
  member('Admin', 'admin'),
);

export const contract = defineContract({ enums: { UserRole } }, ({ field, model }) => {
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

  return {
    models: { User },
  };
});
