import path from 'node:path';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Add it to .env in the @repo/database.');
}

const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
export type Database = typeof db;
