import type { AuthUser, UserRole } from "../infrastructure/auth.service";

// Whitelists the fields sent to clients, so nothing else on the user can leak.
export class AuthUserResponseDto {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;

  private constructor(user: AuthUser) {
    this.id = user.id;
    this.email = user.email;
    this.role = user.role;
  }

  static from(user: AuthUser): AuthUserResponseDto {
    return new AuthUserResponseDto(user);
  }
}
