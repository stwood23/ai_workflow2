/**
 * @description
 * Initializes and exports the Drizzle ORM client connected to the PostgreSQL database.
 * It uses the `postgres` library to create a connection pool based on the `DATABASE_URL` environment variable.
 * The Drizzle client is configured with the application's database schema definitions.
 *
 * Key features:
 * - Establishes the database connection pool.
 * - Creates the main Drizzle ORM instance (`db`).
 * - Associates the Drizzle instance with the application's schemas (initially empty, will be populated later).
 *
 * @dependencies
 * - drizzle-orm: The Drizzle ORM library.
 * - postgres: The PostgreSQL client library for Node.js used by Drizzle.
 * - dotenv/config: Loads environment variables.
 * - @/db/schema: Imports the combined schema object (though initially empty).
 *
 * @notes
 * - The `DATABASE_URL` must be set in the environment variables (`.env.local`).
 * - The `schema` object passed to `drizzle` will be updated in subsequent steps as new table schemas are defined.
 * - This `db` instance is imported by server actions and other backend modules to interact with the database.
 */
import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

// Import specific table definitions
import { profilesTable, promptTemplatesTable } from "@/db/schema"

// Construct the schema object Drizzle expects for query syntax
const schema = {
  profiles: profilesTable,
  promptTemplates: promptTemplatesTable
  // Add other table mappings here as needed
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Create the connection pool using the connection string
const client = postgres(process.env.DATABASE_URL, { max: 1 })

// Create the Drizzle instance, passing the connection pool and the structured schema object
export const db = drizzle(client, { schema })
