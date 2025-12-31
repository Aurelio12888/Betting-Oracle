import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Ensure this points exactly to the schema file you requested
  schema: './src/shared/schema.ts',
  // migrations / out directory (adjust if you use a different path)
  out: './drizzle',
  // driver used for generating SQL (adjust if you use a different DB)
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
});
