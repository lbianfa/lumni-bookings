import "dotenv/config";

import { hashPassword } from "../auth/infrastructure/password-hasher.ts";
import { connectDatabase, db } from "./db.ts";

// Demo accounts (README, D-20). Re-running the seed resets their password and role.
const DEMO_PASSWORD = "lumni-demo";

const users = [
  { email: "customer@lumni.test", role: "customer" },
  { email: "admin@lumni.test", role: "admin" },
] as const;

// Rooms (README, D-22): hourly rate by size (CONTEXT §1.1), capacity for the assistant (D-12).
const SIZES = {
  small: { prefix: "S", count: 5, capacity: 4, hourlyRate: "40000.00" },
  medium: { prefix: "M", count: 4, capacity: 8, hourlyRate: "70000.00" },
  large: { prefix: "L", count: 3, capacity: 16, hourlyRate: "120000.00" },
} as const;

const rooms = Object.entries(SIZES).flatMap(([size, { prefix, count, capacity, hourlyRate }]) =>
  Array.from({ length: count }, (_, index) => ({
    name: `Room ${prefix}${index + 1}`,
    size: size as keyof typeof SIZES,
    capacity,
    hourlyRate,
  })),
);

async function seed(): Promise<void> {
  await connectDatabase();

  for (const user of users) {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    await db.orm.public.User.upsert({
      create: { ...user, passwordHash },
      update: { role: user.role, passwordHash },
      conflictOn: { email: user.email },
    });
  }

  for (const room of rooms) {
    await db.orm.public.Room.upsert({
      create: room,
      update: { size: room.size, capacity: room.capacity, hourlyRate: room.hourlyRate },
      conflictOn: { name: room.name },
    });
  }
}

try {
  await seed();
  console.log(`Seeded ${users.length} users and ${rooms.length} rooms`);
} finally {
  await db.close();
}
