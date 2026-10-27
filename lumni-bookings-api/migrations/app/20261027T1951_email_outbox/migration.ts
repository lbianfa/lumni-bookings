#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/e05f1303b1c450cea79dd3b4300cdd0787c1272181ec909b103570dcb1588759/contract';
import endContract from '../../snapshots/e05f1303b1c450cea79dd3b4300cdd0787c1272181ec909b103570dcb1588759/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ea9c8cac0f4f1f26c79d06f1a3949ef6656bccae839f7f1f6e3e15813b17947c/contract';
import startContract from '../../snapshots/ea9c8cac0f4f1f26c79d06f1a3949ef6656bccae839f7f1f6e3e15813b17947c/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'EmailOutbox',
        columns: [
          col('attempts', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('body', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('bookingId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('lastError', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nextAttemptAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('providerMessageId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sentAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('subject', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('toAddress', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'EmailOutbox_status_check_a1bd2f80',
            sql`"status" IN ('pending', 'sent', 'failed')`,
          ),
          checkExpression(
            'EmailOutbox_type_check_29e0809a',
            sql`"type" IN ('booking_confirmation')`,
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'EmailOutbox',
        constraint: 'EmailOutbox_bookingId_type_key',
        columns: ['bookingId', 'type'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmailOutbox',
        index: 'EmailOutbox_bookingId_idx_17848f4a',
        columns: ['bookingId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'EmailOutbox',
        foreignKey: {
          name: 'EmailOutbox_bookingId_fkey',
          columns: ['bookingId'],
          references: { schema: 'public', table: 'Booking', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
