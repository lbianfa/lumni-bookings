/** An additional service with a flat price per booking (D-14). */
export interface Service {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  /** COP cents, exact (D-13). */
  readonly priceCents: number;
}
