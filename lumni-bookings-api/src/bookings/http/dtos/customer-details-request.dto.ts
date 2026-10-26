import { z } from "zod";

// Step 1 body; an empty company is stored as no company.
export class CustomerDetailsRequestDto {
  static readonly schema = z.object({
    fullName: z.string().trim().min(1),
    email: z.email(),
    company: z.string().trim().nullable(),
  });

  readonly fullName: string;
  readonly email: string;
  readonly company: string | null;

  constructor({ fullName, email, company }: z.infer<typeof CustomerDetailsRequestDto.schema>) {
    this.fullName = fullName;
    this.email = email;
    this.company = company || null;
  }
}
