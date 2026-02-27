import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: './.env' });

const connectionString = process.env.DIRECT_DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Add it to .env in the @repo/database.');
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
});
