import { z } from "zod";

// Shape only; the grid, duration and opening-hours rules live in the domain.
export class QuoteRequestDto {
  static readonly schema = z.object({
    roomId: z.uuid(),
    date: z.iso.date(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:mm"),
    durationMinutes: z.int().positive(),
  });

  readonly roomId: string;
  readonly date: string;
  readonly startMinute: number;
  readonly durationMinutes: number;

  constructor({ roomId, date, startTime, durationMinutes }: z.infer<typeof QuoteRequestDto.schema>) {
    const [hours, minutes] = startTime.split(":").map(Number);
    this.roomId = roomId;
    this.date = date;
    this.startMinute = hours * 60 + minutes;
    this.durationMinutes = durationMinutes;
  }
}
