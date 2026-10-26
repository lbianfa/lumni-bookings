import { Inject, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { AuthService } from "../infrastructure/auth.service";
import { SESSION_COOKIE } from "./session-cookie";

export interface AuthenticatedRequest extends Request {
  session: { userId: string };
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[SESSION_COOKIE];
    const payload = typeof token === "string" ? await this.auth.verifySession(token) : null;
    if (!payload) throw new UnauthorizedException();

    request.session = { userId: payload.sub };
    return true;
  }
}
