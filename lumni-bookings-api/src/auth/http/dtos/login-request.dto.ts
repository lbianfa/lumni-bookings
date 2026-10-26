import { z } from "zod";

export class LoginRequestDto {
  static readonly schema = z.object({
    email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
    password: z.string().min(1).max(200),
  });

  readonly email: string;
  readonly password: string;

  constructor({ email, password }: z.infer<typeof LoginRequestDto.schema>) {
    this.email = email;
    this.password = password;
  }
}
