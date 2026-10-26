import type { Transaction } from "../../../shared/application/unit-of-work";
import type { Customer } from "../entities/customer";

// Port: one customer per user (README); bookings reads and updates it; tests replace it with an in-memory fake.
export abstract class CustomerRepository {
  /** The customer linked to the user, or `null` when the user has none (the admin). */
  abstract findByUserId(userId: string, tx?: Transaction): Promise<Customer | null>;
  abstract findById(id: string, tx?: Transaction): Promise<Customer | null>;
  /** Saves the customer's details; throws `CustomerEmailTakenError` when another customer has the email. */
  abstract update(customer: Customer, tx?: Transaction): Promise<void>;
}
