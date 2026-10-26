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
import { ApiCookieAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { AuthService } from "../infrastructure/auth.service";
import { ApiError, ApiJsonBody, badRequestBodySchema } from "../../shared/http/openapi";
import { ZodValidationPipe } from "../../shared/http/zod-validation.pipe";
import { AuthUserResponseDto } from "./dtos/auth-user-response.dto";
import { LoginRequestDto } from "./dtos/login-request.dto";
import { SESSION_COOKIE, clearSessionCookieOptions, sessionCookieOptions } from "./session-cookie";
import { SessionGuard, type AuthenticatedRequest } from "./session.guard";

@Controller("auth")
@ApiTags("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Sign in; sets the session cookie (D-19, D-20)" })
  @ApiOkResponse({ description: "The signed-in user", standardSchema: AuthUserResponseDto.schema })
  @ApiError(400, "Invalid body", badRequestBodySchema)
  @ApiError(401, "Invalid email or password")
  @ApiJsonBody(LoginRequestDto.schema)
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
  @ApiOperation({ summary: "Sign out; clears the session cookie" })
  @ApiNoContentResponse({ description: "Signed out" })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(SESSION_COOKIE, clearSessionCookieOptions());
  }

  @Get("me")
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "The signed-in user" })
  @ApiOkResponse({ description: "The signed-in user", standardSchema: AuthUserResponseDto.schema })
  @ApiError(401, "No valid session cookie")
  async me(@Req() request: AuthenticatedRequest): Promise<AuthUserResponseDto> {
    const user = await this.auth.findUser(request.session.userId);
    if (!user) throw new UnauthorizedException();
    return AuthUserResponseDto.from(user);
  }
}
