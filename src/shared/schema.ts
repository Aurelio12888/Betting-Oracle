import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * Defines the 'signals' table in the database.
 * Add/remove/adjust columns as needed for your domain model.
 */
export const signals = pgTable('signals', {
  id: serial('id').primaryKey(),
  // example columns - adapt types/names to your app
  market: text('market').notNull(),
  type: text('type').notNull(),
  value: integer('value').notNull(),
  metadata: text('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Export a schema object and a default export so drizzle-kit
 * or any other importer can import whichever form it expects.
 */
export const schema = { signals };
export default schema;
