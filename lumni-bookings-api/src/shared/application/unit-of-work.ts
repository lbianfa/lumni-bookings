declare const transactionBrand: unique symbol;

/** An open database transaction. Opaque: only infrastructure adapters know what it holds. */
export interface Transaction {
  readonly [transactionBrand]: true;
}

// Port: runs writes that span several repositories (and modules) atomically; tests replace it with a fake.
export abstract class UnitOfWork {
  /** Runs `work` in one transaction: it commits when `work` resolves and rolls back when it throws. */
  abstract run<T>(work: (tx: Transaction) => Promise<T>): Promise<T>;
}
