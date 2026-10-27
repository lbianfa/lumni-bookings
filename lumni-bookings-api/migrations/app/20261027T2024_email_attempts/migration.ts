#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/71d4ec4a71e9994cec823861e04baeab1ca9e48665ccbf988433cf1b1532b9d9/contract';
import endContract from '../../snapshots/71d4ec4a71e9994cec823861e04baeab1ca9e48665ccbf988433cf1b1532b9d9/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e05f1303b1c450cea79dd3b4300cdd0787c1272181ec909b103570dcb1588759/contract';
import startContract from '../../snapshots/e05f1303b1c450cea79dd3b4300cdd0787c1272181ec909b103570dcb1588759/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
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
        table: 'EmailAttempt',
        columns: [
          col('attemptedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('emailId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('error', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('outcome', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('providerMessageId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'EmailAttempt_outcome_check_75423ccf',
            sql`"outcome" IN ('sent', 'failed')`,
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmailAttempt',
        index: 'EmailAttempt_emailId_idx_f0213919',
        columns: ['emailId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'EmailAttempt',
        foreignKey: {
          name: 'EmailAttempt_emailId_fkey',
          columns: ['emailId'],
          references: { schema: 'public', table: 'EmailOutbox', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
