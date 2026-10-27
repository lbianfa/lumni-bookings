import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

import { DomainError } from "../../../shared/domain/domain-error";
import { EmailNotFoundError } from "../domain/exceptions";

// Maps the emails feature's domain errors to the HTTP contract; the domain never throws HttpException.
@Catch(DomainError)
export class EmailsExceptionFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost): void {
    const body =
      error instanceof EmailNotFoundError
        ? { statusCode: HttpStatus.NOT_FOUND, message: error.message }
        : { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal server error" };
    host.switchToHttp().getResponse<Response>().status(body.statusCode).json(body);
  }
}
