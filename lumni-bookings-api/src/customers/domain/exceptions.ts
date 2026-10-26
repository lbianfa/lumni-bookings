import { DomainError } from "../../shared/domain/domain-error";

export class CustomerEmailTakenError extends DomainError {
  constructor() {
    super("Another customer already uses that email.");
  }
}
