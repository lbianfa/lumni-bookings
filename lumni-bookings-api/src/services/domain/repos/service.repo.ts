import type { Transaction } from "../../../shared/application/unit-of-work";
import type { Service } from "../entities/service";

// Port: the additional services catalog; tests replace it with an in-memory fake.
export abstract class ServiceRepository {
  /** Every service, ordered by name. */
  abstract list(tx?: Transaction): Promise<Service[]>;
}
