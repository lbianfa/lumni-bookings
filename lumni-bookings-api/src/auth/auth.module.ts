import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "./http/auth.controller";
import { SESSION_TTL_SECONDS } from "./http/session-cookie";
import { AdminGuard } from "./http/admin.guard";
import { SessionGuard } from "./http/session.guard";
import { AuthService } from "./infrastructure/auth.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET?.trim();
        if (!secret) throw new Error("JWT_SECRET is required");
        return { secret, signOptions: { expiresIn: SESSION_TTL_SECONDS } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionGuard, AdminGuard],
  exports: [AuthService, SessionGuard, AdminGuard],
})
export class AuthModule {}
