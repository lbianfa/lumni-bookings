import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";

import { AuthService, type AuthUser } from "../infrastructure/auth.service";
import { SESSION_COOKIE, clearSessionCookieOptions, sessionCookieOptions } from "./session-cookie";
import { SessionGuard, type AuthenticatedRequest } from "./session.guard";
import { ZodValidationPipe } from "./zod-validation.pipe";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(1).max(200),
});

type LoginBody = z.infer<typeof loginSchema>;

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUser> {
    const user = await this.auth.verifyCredentials(body.email, body.password);
    if (!user) throw new UnauthorizedException("Invalid email or password");

    response.cookie(SESSION_COOKIE, await this.auth.signSession(user), sessionCookieOptions());
    return user;
  }

  @Post("logout")
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(SESSION_COOKIE, clearSessionCookieOptions());
  }

  @Get("me")
  @UseGuards(SessionGuard)
  async me(@Req() request: AuthenticatedRequest): Promise<AuthUser> {
    const user = await this.auth.findUser(request.session.userId);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
