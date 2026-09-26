import { relations } from 'drizzle-orm';
import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or persistent unique ID
  email: text('email').notNull().unique(),
  name: text('name').default('Trader'),
  role: text('role').notNull().default('USER'),
  plan: text('plan').notNull().default('PRO'),
  subscription_status: text('subscription_status').notNull().default('active'),
  is_verified: boolean('is_verified').notNull().default(true),
  verification_status: text('verification_status').notNull().default('verified'),
  password_hash: text('password_hash').default(''),
  salt: text('salt').default(''),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  theme: text('theme').default('dark'),
  notificationsEnabled: boolean('notifications_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userWatchlists = pgTable('user_watchlists', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  symbol: text('symbol').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  preferences: many(userPreferences),
  watchlists: many(userWatchlists),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.uid],
  }),
}));

export const userWatchlistsRelations = relations(userWatchlists, ({ one }) => ({
  user: one(users, {
    fields: [userWatchlists.userId],
    references: [users.uid],
  }),
}));
