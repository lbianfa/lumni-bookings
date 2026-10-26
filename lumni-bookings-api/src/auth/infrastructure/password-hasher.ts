import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Verified when the email is unknown, so both failures take the same time.
export const DUMMY_PASSWORD_HASH = "$2b$12$Nsls1Z1dGYMRwXHAVZGnPe5BOmPFii.4g8Nreuja8arSMpCApfpA.";
