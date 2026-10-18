import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const rooms = sqliteTable('consequence_rooms', {
  id: text('id').primaryKey(),
  revision: integer('revision').notNull().default(0),
  state: text('state').notNull(),
  seatAHash: text('seat_a_hash').notNull(),
  seatBHash: text('seat_b_hash'),
  inviteHash: text('invite_hash'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const seatKeys = sqliteTable('consequence_seat_keys', {
  keyHash: text('key_hash').primaryKey(),
  roomId: text('room_id').notNull(),
  seat: text('seat').notNull(),
  accountId: text('account_id'),
  createdAt: integer('created_at').notNull(),
});

export const stateChunks = sqliteTable('consequence_state_chunks', {
  snapshotId: text('snapshot_id').notNull(),
  roomId: text('room_id').notNull(),
  part: integer('part').notNull(),
  payload: text('payload').notNull(),
  createdAt: integer('created_at').notNull(),
}, table => [primaryKey({columns: [table.snapshotId, table.part]})]);
