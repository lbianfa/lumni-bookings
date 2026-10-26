// Base class for business rule violations. HTTP filters map subclasses to status codes.
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
