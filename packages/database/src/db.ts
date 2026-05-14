import path from 'node:path';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

import * as schema from './schema/index.js';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let cached: DrizzleDb | undefined;

const initDb = (): DrizzleDb => {
  if (cached) return cached;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to .env in the @repo/database.');
  }
  const pool = new Pool({ connectionString });
  cached = drizzle(pool, { schema });
  return cached;
};

// Proxied so `DATABASE_URL` is only required when something actually touches
// the database. Lets tooling that loads this module (e.g. better-auth's
// `auth:generate` CLI) run without a real connection string.
export const db = new Proxy({} as DrizzleDb, {
  get: (_target, prop, receiver) => Reflect.get(initDb(), prop, receiver),
}) as DrizzleDb;

export type Database = DrizzleDb;

/**
 * Transaction handle passed to `db.transaction(async (tx) => ...)`.
 * Repos accept `tx?: DbOrTx` so services can stitch multiple writes
 * into a single transaction.
 */
export type Transaction = Parameters<Parameters<DrizzleDb['transaction']>[0]>[0];
export type DbOrTx = Database | Transaction;
