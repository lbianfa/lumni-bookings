import { DomainError } from "../../../shared/domain/domain-error";

/** The email provider refused or could not take the email. */
export class EmailNotSentError extends DomainError {
  constructor(reason: string) {
    super(reason);
  }
}
