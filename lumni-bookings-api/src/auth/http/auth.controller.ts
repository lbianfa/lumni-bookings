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

import { AuthService } from "../infrastructure/auth.service";
import { ZodValidationPipe } from "../../shared/http/zod-validation.pipe";
import { AuthUserResponseDto } from "./dtos/auth-user-response.dto";
import { LoginRequestDto } from "./dtos/login-request.dto";
import { SESSION_COOKIE, clearSessionCookieOptions, sessionCookieOptions } from "./session-cookie";
import { SessionGuard, type AuthenticatedRequest } from "./session.guard";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(LoginRequestDto)) body: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUserResponseDto> {
    const user = await this.auth.verifyCredentials(body.email, body.password);
    if (!user) throw new UnauthorizedException("Invalid email or password");

    response.cookie(SESSION_COOKIE, await this.auth.signSession(user), sessionCookieOptions());
    return AuthUserResponseDto.from(user);
  }

  @Post("logout")
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(SESSION_COOKIE, clearSessionCookieOptions());
  }

  @Get("me")
  @UseGuards(SessionGuard)
  async me(@Req() request: AuthenticatedRequest): Promise<AuthUserResponseDto> {
    const user = await this.auth.findUser(request.session.userId);
    if (!user) throw new UnauthorizedException();
    return AuthUserResponseDto.from(user);
  }
}
