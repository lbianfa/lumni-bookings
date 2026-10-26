import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";

import { AuthService } from "../infrastructure/auth.service";
import type { AuthenticatedRequest } from "./session.guard";

// Runs after SessionGuard: `@UseGuards(SessionGuard, AdminGuard)`. The session only carries the user id,
// so the role is read from the stored user on every request.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.session?.userId;
    if (!userId) throw new UnauthorizedException();

    const user = await this.auth.findUser(userId);
    if (!user) throw new UnauthorizedException();
    if (user.role !== "admin") throw new ForbiddenException();
    return true;
  }
}
