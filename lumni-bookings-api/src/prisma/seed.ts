import "dotenv/config";

import { hashPassword } from "../auth/infrastructure/password-hasher.ts";
import { connectDatabase, db } from "./db.ts";

// Demo accounts (README, P-02). Re-running the seed resets their password and role.
const DEMO_PASSWORD = "lumni-demo";

const users = [
  { email: "customer@lumni.test", role: "customer" },
  { email: "admin@lumni.test", role: "admin" },
] as const;

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
}

try {
  await seed();
  console.log(`Seeded ${users.length} users`);
} finally {
  await db.close();
}
