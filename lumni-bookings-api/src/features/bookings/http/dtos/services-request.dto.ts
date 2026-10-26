import { z } from "zod";

// Step 3 body: the selected services; whether they exist is checked by the use case.
export class ServicesRequestDto {
  static readonly schema = z.object({
    serviceIds: z.array(z.uuid()),
  });

  readonly serviceIds: readonly string[];

  constructor({ serviceIds }: z.infer<typeof ServicesRequestDto.schema>) {
    this.serviceIds = serviceIds;
  }
}
