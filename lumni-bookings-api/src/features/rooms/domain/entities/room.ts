export type RoomSize = "small" | "medium" | "large";

export interface Room {
  readonly id: string;
  readonly name: string;
  readonly size: RoomSize;
  /** COP cents, exact (D-13). */
  readonly hourlyRateCents: number;
  readonly capacity: number;
}
