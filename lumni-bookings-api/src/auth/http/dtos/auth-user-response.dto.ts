import { z } from "zod";

import type { AuthUser, UserRole } from "../../infrastructure/auth.service";

const authUserResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: z.enum(["customer", "admin"]),
});

// Whitelists the fields sent to clients, so nothing else on the user can leak; `schema` documents them.
export class AuthUserResponseDto implements z.infer<typeof authUserResponseSchema> {
  static readonly schema = authUserResponseSchema;

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
