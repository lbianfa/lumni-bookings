import { BadRequestException, type PipeTransform } from "@nestjs/common";
import { z } from "zod";

export interface ValidatedDtoClass<Dto, Input> {
  readonly schema: z.ZodType<Input>;
  new (input: Input): Dto;
}

// Takes the DTO class explicitly: `tsx` emits no decorator metadata, so a type-driven ValidationPipe cannot work.
export class ZodValidationPipe<Dto, Input> implements PipeTransform<unknown, Dto> {
  constructor(private readonly dto: ValidatedDtoClass<Dto, Input>) {}

  transform(value: unknown): Dto {
    const result = this.dto.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        message: "Invalid request body",
        errors: z.flattenError(result.error).fieldErrors,
      });
    }
    return new this.dto(result.data);
  }
}
