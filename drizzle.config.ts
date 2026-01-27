import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './migrations',
  schema: './src/entities/counter/model/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
});
