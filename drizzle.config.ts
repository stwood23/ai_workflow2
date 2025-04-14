/**
 * @description
 * Configuration for Drizzle ORM and Drizzle Kit.
 *
 * This file configures the database connection and migration settings for Drizzle ORM.
 * It is used both by the application (via db.ts) and by Drizzle Kit CLI tools for migrations.
 *
 * - This configuration is used by commands like `npx drizzle-kit generate:pg` and `npx drizzle-kit push:pg`.
 */
import "dotenv/config"; // Ensure environment variables are loaded
// import type { Config } from "drizzle-kit"; // defineConfig handles typing
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required for Drizzle Kit configuration."
  );
}

export default defineConfig({
  schema: "./db/schema/index.ts", // Path to the main schema export file
  out: "./db/migrations", // Directory to store migration files
  dialect: "postgresql", // Use 'dialect' instead of 'driver' for newer versions
  dbCredentials: {
    url: process.env.DATABASE_URL, // Use 'url' instead of 'connectionString' for postgresql dialect
  },
  verbose: true, // Optional: Enable verbose logging from Drizzle Kit
  strict: true, // Optional: Enable strict mode for type checking
})
// Remove the 'satisfies Config' as defineConfig returns the correctly typed config
// } satisfies Config;
