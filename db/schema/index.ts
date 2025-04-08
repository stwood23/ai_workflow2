/*
<ai_context>
Exports the database schema for the app.
</ai_context>
*/

/**
 * @description
 * Central export point for all Drizzle ORM database schemas.
 * This file aggregates and re-exports schemas defined in separate files
 * within the `db/schema` directory, making them easily accessible
 * for the Drizzle client instance and other parts of the application.
 *
 * Key features:
 * - Exports all defined schemas (initially enums, tables will be added later).
 *
 * @dependencies
 * - ./enums.ts: Exports the shared database enums.
 * - (Future table schema files, e.g., ./prompt-templates.ts)
 *
 * @notes
 * - This file is referenced by `drizzle.config.ts` to inform Drizzle Kit about the schema structure.
 * - It is also imported by `db/db.ts` to provide the schema object to the Drizzle client.
 */

// Export shared enums first
export * from "./enums"

// Schemas for database tables will be exported below as they are created
// Example:
// export * from "./prompt-templates";
// export * from "./documents";

export * from "./profiles-schema"
export * from "./todos-schema"
