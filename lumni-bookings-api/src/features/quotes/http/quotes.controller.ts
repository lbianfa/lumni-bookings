import { Body, Controller, HttpCode, Inject, Post, UseFilters, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { SessionGuard } from "../../../auth/http/session.guard";
import { ApiError, ApiJsonBody, badRequestBodySchema } from "../../../shared/http/openapi";
import { ZodValidationPipe } from "../../../shared/http/zod-validation.pipe";
import { QuoteRoom } from "../application/quote-room.use-case";
import { QuotesExceptionFilter } from "./quotes-exception.filter";
import { QuoteRequestDto } from "./dtos/quote-request.dto";
import { QuoteResponseDto } from "./dtos/quote-response.dto";

@Controller("quotes")
@UseGuards(SessionGuard)
@UseFilters(QuotesExceptionFilter)
@ApiTags("quotes")
@ApiCookieAuth()
export class QuotesController {
  constructor(@Inject(QuoteRoom) private readonly quoteRoom: QuoteRoom) {}

  // A quote creates nothing, so it answers 200 rather than 201.
  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: "Price a room for a slot and check its availability (CONTEXT §1.1)" })
  @ApiOkResponse({
    description: "The quote; an unavailable slot still answers 200, with `available: false`, a reason and a suggestion",
    standardSchema: QuoteResponseDto.schema,
  })
  @ApiError(400, "Invalid body or slot", badRequestBodySchema)
  @ApiError(401, "No valid session cookie")
  @ApiError(404, "Room not found")
  @ApiJsonBody(QuoteRequestDto.schema)
  async quote(
    @Body(new ZodValidationPipe(QuoteRequestDto)) body: QuoteRequestDto,
  ): Promise<QuoteResponseDto> {
    return QuoteResponseDto.from(await this.quoteRoom.execute(body));
  }
}
