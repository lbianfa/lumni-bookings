#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/070ba5217aa9f37eb24353385973b726a35a63bb39f1d26cfcfaafbe91738234/contract';
import startContract from '../../snapshots/070ba5217aa9f37eb24353385973b726a35a63bb39f1d26cfcfaafbe91738234/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ea9c8cac0f4f1f26c79d06f1a3949ef6656bccae839f7f1f6e3e15813b17947c/contract';
import endContract from '../../snapshots/ea9c8cac0f4f1f26c79d06f1a3949ef6656bccae839f7f1f6e3e15813b17947c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'BookingLine',
        columns: [
          col('amount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('bookingId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('concept', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'BookingService',
        columns: [
          col('bookingId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('serviceId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['bookingId', 'serviceId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Customer',
        columns: [
          col('company', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('fullName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Service',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('price', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('cancellationReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('cancelledAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('confirmedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('currentStep', 'int4', {
          notNull: true,
          default: lit(1),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('customerId', 'character(36)', {
          codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
        }),
      }),
      this.addRequiredColumnToEmptyTable({
        schema: 'public',
        table: 'Booking',
        column: 'customerId',
        type: 'character(36)',
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Booking',
        column: 'quotedAt',
        type: 'timestamptz',
        temporaryDefault: sql`'epoch'`,
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Booking',
        column: 'total',
        type: 'numeric(14,2)',
        temporaryDefault: sql`0`,
      }),
      this.addUnique({
        schema: 'public',
        table: 'Customer',
        constraint: 'Customer_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Service',
        constraint: 'Service_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_customerId_key',
        columns: ['customerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Booking',
        index: 'Booking_customerId_idx_b2a8a46c',
        columns: ['customerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'BookingLine',
        index: 'BookingLine_bookingId_idx_17848f4a',
        columns: ['bookingId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'BookingService',
        index: 'BookingService_bookingId_idx_17848f4a',
        columns: ['bookingId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'BookingService',
        index: 'BookingService_serviceId_idx_b5d9acbf',
        columns: ['serviceId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'BookingLine',
        foreignKey: {
          name: 'BookingLine_bookingId_fkey',
          columns: ['bookingId'],
          references: { schema: 'public', table: 'Booking', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'BookingService',
        foreignKey: {
          name: 'BookingService_bookingId_fkey',
          columns: ['bookingId'],
          references: { schema: 'public', table: 'Booking', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'BookingService',
        foreignKey: {
          name: 'BookingService_serviceId_fkey',
          columns: ['serviceId'],
          references: { schema: 'public', table: 'Service', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Booking',
        foreignKey: {
          name: 'Booking_customerId_fkey',
          columns: ['customerId'],
          references: { schema: 'public', table: 'Customer', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'User',
        foreignKey: {
          name: 'User_customerId_fkey',
          columns: ['customerId'],
          references: { schema: 'public', table: 'Customer', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
