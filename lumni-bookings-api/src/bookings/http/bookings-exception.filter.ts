import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

import { CustomerEmailTakenError } from "../../customers/domain/exceptions";
import { InvalidTimeSlotError, RoomNotFoundError } from "../../quotes/domain/exceptions";
import { describeUnavailability } from "../../quotes/http/dtos/quote-response.dto";
import { DomainError } from "../../shared/domain/domain-error";
import {
  BookingNotEditableError,
  BookingNotFoundError,
  CustomerRequiredError,
  InvalidStatusTransitionError,
  QuoteExpiredError,
  SlotTakenError,
  SlotUnavailableError,
  StepNotReachedError,
  UnknownServiceError,
} from "../domain/exceptions";

type ErrorBody = { statusCode: number; message: string } & Record<string, unknown>;

function bodyOf(error: DomainError): ErrorBody {
  const body = (statusCode: number, extra: Record<string, unknown> = {}): ErrorBody => ({
    statusCode,
    message: error.message,
    ...extra,
  });
  const conflict = (code: string) => body(HttpStatus.CONFLICT, { code });

  if (error instanceof BookingNotFoundError || error instanceof RoomNotFoundError) return body(HttpStatus.NOT_FOUND);
  if (error instanceof CustomerRequiredError) return body(HttpStatus.FORBIDDEN);
  if (error instanceof InvalidTimeSlotError || error instanceof UnknownServiceError) return body(HttpStatus.BAD_REQUEST);
  if (error instanceof SlotUnavailableError) {
    return {
      statusCode: HttpStatus.CONFLICT,
      message: describeUnavailability(error.reason, error),
      code: "slot_unavailable",
      reason: error.reason.code,
    };
  }
  if (error instanceof SlotTakenError) return conflict("slot_taken");
  if (error instanceof CustomerEmailTakenError) return conflict("email_taken");
  if (error instanceof BookingNotEditableError || error instanceof InvalidStatusTransitionError) {
    return conflict("not_editable");
  }
  if (error instanceof StepNotReachedError) return conflict("step_not_reached");
  if (error instanceof QuoteExpiredError) return conflict("quote_expired");
  return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal server error" };
}

// Maps the booking flow's domain errors to the HTTP contract; the domain never throws HttpException.
@Catch(DomainError)
export class BookingsExceptionFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost): void {
    const body = bodyOf(error);
    host.switchToHttp().getResponse<Response>().status(body.statusCode).json(body);
  }
}
