import { Inject, Injectable } from "@nestjs/common";
// The same implementation `db.ts` installs as the global `Temporal` the timestamptz codec uses.
import { Temporal } from "temporal-polyfill";

import { PrismaService } from "../../../prisma.service";
import type { Transaction } from "../../../shared/application/unit-of-work";
import { ormOf } from "../../../shared/infrastructure/prisma-unit-of-work";
import type { EmailAttempt, EmailAttemptOutcome } from "../domain/entities/email-attempt";
import { OutboxEmail, type EmailStatus, type EmailType, type NewOutboxEmail } from "../domain/entities/outbox-email";
import { OutboxEmailRepository } from "../domain/repos/outbox-email.repo";

const OUTBOX_FIELDS = [
  "id",
  "bookingId",
  "type",
  "toAddress",
  "subject",
  "body",
  "status",
  "attempts",
  "lastError",
  "providerMessageId",
  "sentAt",
] as const;

interface OutboxRow {
  id: unknown;
  bookingId: unknown;
  type: EmailType;
  toAddress: string;
  subject: string;
  body: string;
  status: EmailStatus;
  attempts: number;
  lastError: string | null;
  providerMessageId: string | null;
  sentAt: Temporal.Instant | null;
}

@Injectable()
export class PrismaOutboxEmailRepository extends OutboxEmailRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async add(email: NewOutboxEmail, tx: Transaction): Promise<string> {
    // UNIQUE(booking_id, type) backs the one-email rule (D-07); the caller's booking row lock means it never fires.
    const row = await ormOf(this.prisma, tx)
      .public.EmailOutbox.select("id")
      .create({
        bookingId: email.bookingId,
        type: email.type,
        toAddress: email.toAddress,
        subject: email.subject,
        body: email.body,
        status: "pending",
      });
    return String(row.id);
  }

  async findById(id: string, tx?: Transaction): Promise<OutboxEmail | null> {
    const row = await ormOf(this.prisma, tx).public.EmailOutbox.select(...OUTBOX_FIELDS).where({ id }).first();
    return row ? toOutboxEmail(row) : null;
  }

  async findByBooking(bookingId: string, type: EmailType, tx?: Transaction): Promise<OutboxEmail | null> {
    const row = await ormOf(this.prisma, tx)
      .public.EmailOutbox.select(...OUTBOX_FIELDS)
      .where({ bookingId, type })
      .first();
    return row ? toOutboxEmail(row) : null;
  }

  async save(email: OutboxEmail, tx: Transaction): Promise<void> {
    await ormOf(this.prisma, tx)
      .public.EmailOutbox.where({ id: email.id })
      .select("id")
      .update({
        status: email.status,
        attempts: email.attempts,
        lastError: email.lastError,
        providerMessageId: email.providerMessageId,
        sentAt: email.sentAt ? toInstant(email.sentAt) : null,
      });
  }

  async addAttempt(emailId: string, attempt: EmailAttempt, tx: Transaction): Promise<void> {
    await ormOf(this.prisma, tx).public.EmailAttempt.create({
      emailId,
      attemptedAt: toInstant(attempt.attemptedAt),
      outcome: attempt.outcome,
      error: attempt.error,
      providerMessageId: attempt.providerMessageId,
    });
  }

  async findAttempts(emailId: string, tx?: Transaction): Promise<EmailAttempt[]> {
    // The id (UUIDv7, time-ordered) breaks ties between attempts made in the same instant.
    const rows = await ormOf(this.prisma, tx)
      .public.EmailAttempt.select("attemptedAt", "outcome", "error", "providerMessageId")
      .where({ emailId })
      .orderBy([(a) => a.attemptedAt.asc(), (a) => a.id.asc()])
      .all();
    return rows.map((row) => ({
      attemptedAt: new Date(row.attemptedAt.epochMilliseconds),
      outcome: row.outcome as EmailAttemptOutcome,
      error: row.error ?? null,
      providerMessageId: row.providerMessageId ?? null,
    }));
  }
}

function toInstant(date: Date): Temporal.Instant {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime());
}

function toOutboxEmail(row: OutboxRow): OutboxEmail {
  return OutboxEmail.restore({
    id: String(row.id),
    bookingId: String(row.bookingId),
    type: row.type,
    toAddress: row.toAddress,
    subject: row.subject,
    body: row.body,
    status: row.status,
    attempts: row.attempts,
    lastError: row.lastError ?? null,
    providerMessageId: row.providerMessageId ?? null,
    sentAt: row.sentAt ? new Date(row.sentAt.epochMilliseconds) : null,
  });
}
