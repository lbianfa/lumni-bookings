import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "../../prisma.service";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "./password-hasher";

export type UserRole = "customer" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface SessionPayload {
  sub: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  async verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
    const row = await this.prisma.db.orm.public.User.select("id", "email", "role", "passwordHash")
      .where({ email })
      .first();
    const valid = await verifyPassword(password, row?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!row || !valid) return null;

    return { id: String(row.id), email: row.email, role: row.role };
  }

  async findUser(id: string): Promise<AuthUser | null> {
    const row = await this.prisma.db.orm.public.User.select("id", "email", "role").where({ id }).first();
    return row ? { id: String(row.id), email: row.email, role: row.role } : null;
  }

  signSession(user: AuthUser): Promise<string> {
    return this.jwt.signAsync({ sub: user.id } satisfies SessionPayload);
  }

  async verifySession(token: string): Promise<SessionPayload | null> {
    try {
      return await this.jwt.verifyAsync<SessionPayload>(token);
    } catch {
      return null;
    }
  }
}
