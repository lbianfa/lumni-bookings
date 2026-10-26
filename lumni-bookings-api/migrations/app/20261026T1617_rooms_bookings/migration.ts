#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/070ba5217aa9f37eb24353385973b726a35a63bb39f1d26cfcfaafbe91738234/contract';
import endContract from '../../snapshots/070ba5217aa9f37eb24353385973b726a35a63bb39f1d26cfcfaafbe91738234/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fc80b979e2ea10429f01e6bdd864441e9d627a9ba60a79bb194a1efbb641f1f2/contract';
import startContract from '../../snapshots/fc80b979e2ea10429f01e6bdd864441e9d627a9ba60a79bb194a1efbb641f1f2/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  primaryKey,
  rawSql,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Booking',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('endsAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('roomId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('startsAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Booking_status_check_5353fd02',
            sql`"status" IN ('draft', 'confirmed', 'completed', 'cancelled')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Room',
        columns: [
          col('capacity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('hourlyRate', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('size', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('Room_size_check_91c8121a', sql`"size" IN ('small', 'medium', 'large')`),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Room',
        constraint: 'Room_name_key',
        columns: ['name'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Booking',
        index: 'Booking_roomId_idx_fe51d647',
        columns: ['roomId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Booking',
        foreignKey: {
          name: 'Booking_roomId_fkey',
          columns: ['roomId'],
          references: { schema: 'public', table: 'Room', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      // D-05: the database rejects overlapping blocking bookings of the same room.
      // Prisma 8 cannot model an exclusion constraint, so it is written by hand.
      rawSql({
        id: 'extension.btree_gist',
        label: 'Install extension "btree_gist"',
        operationClass: 'additive',
        target: {
          id: 'postgres',
          details: { schema: 'public', objectType: 'dependency', name: 'btree_gist' },
        },
        precheck: [],
        execute: [
          {
            description: 'install extension "btree_gist"',
            sql: 'CREATE EXTENSION IF NOT EXISTS btree_gist',
          },
        ],
        postcheck: [
          {
            description: 'verify extension "btree_gist" is installed',
            sql: "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist')",
            expectation: { expects: 'present', object: 'extension "btree_gist"' },
          },
        ],
      }),
      rawSql({
        id: 'exclusion.Booking.Booking_room_slot_excl',
        label: 'Add exclusion constraint "Booking_room_slot_excl" on "Booking"',
        operationClass: 'additive',
        target: {
          id: 'postgres',
          details: {
            schema: 'public',
            objectType: 'checkConstraint',
            name: 'Booking_room_slot_excl',
            table: 'Booking',
          },
        },
        precheck: [
          {
            description: 'ensure constraint "Booking_room_slot_excl" does not exist',
            sql: "SELECT NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_room_slot_excl' AND conrelid = to_regclass('\"public\".\"Booking\"'))",
            expectation: { expects: 'absent', object: 'constraint "Booking_room_slot_excl" on "Booking"' },
          },
        ],
        execute: [
          {
            description: 'add exclusion constraint "Booking_room_slot_excl"',
            // Half-open intervals [start, end); only confirmed and completed bookings block a slot (D-04).
            sql: `ALTER TABLE "public"."Booking"
ADD CONSTRAINT "Booking_room_slot_excl"
EXCLUDE USING gist ("roomId" WITH =, tstzrange("startsAt", "endsAt", '[)') WITH &&)
WHERE ("status" IN ('confirmed', 'completed'))`,
          },
        ],
        postcheck: [
          {
            description: 'verify exclusion constraint "Booking_room_slot_excl" exists',
            sql: "SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_room_slot_excl' AND conrelid = to_regclass('\"public\".\"Booking\"') AND contype = 'x')",
            expectation: { expects: 'present', object: 'constraint "Booking_room_slot_excl" on "Booking"' },
          },
        ],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
