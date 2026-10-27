import { DomainError } from "../../../shared/domain/domain-error";

/** The booking has no email of the requested type: it was never confirmed, or it does not exist. */
export class EmailNotFoundError extends DomainError {
  constructor() {
    super("Email not found");
  }
}

/** The email provider refused or could not take the email. */
export class EmailNotSentError extends DomainError {
  constructor(reason: string) {
    super(reason);
  }
}
