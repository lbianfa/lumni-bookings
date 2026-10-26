import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

import { DomainError } from "../../../shared/domain/domain-error";
import { InvalidTimeSlotError, RoomNotFoundError } from "../domain/exceptions";

// Maps the quotes domain errors to HTTP status codes; the domain never throws HttpException.
@Catch(DomainError)
export class QuotesExceptionFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (error instanceof RoomNotFoundError) {
      response.status(HttpStatus.NOT_FOUND).json({ statusCode: HttpStatus.NOT_FOUND, message: error.message });
    } else if (error instanceof InvalidTimeSlotError) {
      response.status(HttpStatus.BAD_REQUEST).json({ statusCode: HttpStatus.BAD_REQUEST, message: error.message });
    } else {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal server error" });
    }
  }
}
