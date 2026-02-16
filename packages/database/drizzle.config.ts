import path from "node:path";

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env from monorepo root so DATABASE_URL is available when running from packages/database
config({ path: path.resolve(__dirname, "../../.env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env in the repo root.");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
