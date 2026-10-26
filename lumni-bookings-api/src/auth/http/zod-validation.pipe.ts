import { BadRequestException, type PipeTransform } from "@nestjs/common";
import { z } from "zod";

// Takes the schema explicitly: `tsx` emits no decorator metadata, so a type-driven ValidationPipe cannot work.
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        message: "Invalid request body",
        errors: z.flattenError(result.error).fieldErrors,
      });
    }
    return result.data;
  }
}
