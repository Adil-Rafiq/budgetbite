import path from "node:path";
import { fileURLToPath } from "url";

import { config } from "dotenv";

// Get current file path (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../../../.env");

// Load dotenv
config({ path: envPath });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema/index.js";

export * from "./schema/index.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env in the repo root.");
}

const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
export type Database = typeof db;
