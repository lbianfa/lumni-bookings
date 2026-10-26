import type { CookieOptions } from "express";

export const SESSION_COOKIE = "lumni_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const baseOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
});

export const sessionCookieOptions = (): CookieOptions => ({
  ...baseOptions(),
  maxAge: SESSION_TTL_SECONDS * 1000,
});

export const clearSessionCookieOptions = baseOptions;
