/**
 * @description
 * Configuration file for Drizzle Kit, the migration tool for Drizzle ORM.
 * It specifies the location of the database schema, the output directory for migration files,
 * the database driver (PostgreSQL), and database credentials (loaded from environment variables).
 *
 * Key features:
 * - Points to the central schema export file (`./db/schema/index.ts`).
 * - Defines the output directory for generated migration SQL files (`./db/migrations`).
 * - Specifies the PostgreSQL driver (`pg`).
 * - Loads the database connection string from the `DATABASE_URL` environment variable.
 *
 * @dependencies
 * - drizzle-kit: The CLI tool that uses this configuration.
 * - dotenv/config: Loads environment variables from .env files.
 *
 * @notes
 * - Ensure the DATABASE_URL environment variable is set in `.env.local` for Drizzle Kit commands to work.
 * - The `out` directory (`./db/migrations`) should typically be committed to version control, although the plan specifies ignoring it for this project.
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
