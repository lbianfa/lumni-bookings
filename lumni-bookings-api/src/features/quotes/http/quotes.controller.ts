import { Body, Controller, HttpCode, Inject, Post, UseFilters, UseGuards } from "@nestjs/common";

import { SessionGuard } from "../../../auth/http/session.guard";
import { ZodValidationPipe } from "../../../shared/http/zod-validation.pipe";
import { QuoteRoom } from "../application/quote-room.use-case";
import { QuotesExceptionFilter } from "./quotes-exception.filter";
import { QuoteRequestDto } from "./dtos/quote-request.dto";
import { QuoteResponseDto } from "./dtos/quote-response.dto";

@Controller("quotes")
@UseGuards(SessionGuard)
@UseFilters(QuotesExceptionFilter)
export class QuotesController {
  constructor(@Inject(QuoteRoom) private readonly quoteRoom: QuoteRoom) {}

  // A quote creates nothing, so it answers 200 rather than 201.
  @Post()
  @HttpCode(200)
  async quote(@Body(new ZodValidationPipe(QuoteRequestDto)) body: QuoteRequestDto): Promise<QuoteResponseDto> {
    return QuoteResponseDto.from(await this.quoteRoom.execute(body));
  }
}
