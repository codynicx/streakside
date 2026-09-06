import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const profiles = pgTable('profiles', {
  id: text().primaryKey(),
  email: text().notNull(),
  displayName: text('display_name').notNull(),
  handle: text().notNull().unique(),
  friendCode: text('friend_code').notNull().unique(),
  avatarHue: integer('avatar_hue').notNull().default(42),
  xp: integer().notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const habits = pgTable('habits', {
  id: text().primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  icon: text().notNull(),
  color: text().notNull(),
  targetPerWeek: integer('target_per_week').notNull().default(7),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const checkins = pgTable(
  'checkins',
  {
    id: text().primaryKey(),
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    ownerId: text('owner_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    checkinDate: text('checkin_date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('checkins_habit_date_unique').on(
      table.habitId,
      table.checkinDate,
    ),
  ],
)

export const sleepEntries = pgTable(
  'sleep_entries',
  {
    id: text().primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    sleepDate: text('sleep_date').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    quality: integer().notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('sleep_entries_owner_date_unique').on(
      table.ownerId,
      table.sleepDate,
    ),
  ],
)

export const friendships = pgTable('friendships', {
  id: text().primaryKey(),
  requesterId: text('requester_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  addresseeId: text('addressee_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  status: text().notNull().default('accepted'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
