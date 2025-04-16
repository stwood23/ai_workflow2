/**
 * @description
 * Defines the Drizzle ORM schema for the `prompt_templates` table.
 * This table stores reusable prompt templates created by users, including
 * the raw input, the optimized version, a title, and the default LLM provider
 * intended for generating content from this template.
 *
 * Key features:
 * - Stores both raw and optimized prompt text.
 * - Includes a user-provided or auto-generated title.
 * - Specifies the default LLM provider for generation.
 * - Tracks creation and update timestamps.
 * - Enforces user ownership via `userId`.
 *
 * @dependencies
 * - drizzle-orm/pg-core: Provides PostgreSQL specific schema building functions (pgTable, text, timestamp, uuid).
 * - ./enums: Imports the shared `llmProviderEnum`.
 *
 * @notes
 * - The `userId` column links to the authenticated user ID (e.g., from Clerk).
 * - `optimizedPrompt` is the version intended for actual LLM interaction during document generation.
 * - Placeholders like `{{placeholder}}` should be stored within the `optimizedPrompt` text.
 */
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const promptTemplatesTable = pgTable("prompt_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // From Clerk auth
  title: text("title").notNull(),
  rawPrompt: text("raw_prompt"), // Initial user input, optional
  optimizedPrompt: text("optimized_prompt").notNull(), // The prompt used for generation, includes {{placeholders}}
  modelId: text("model_id").notNull(), // Specific model identifier (e.g., gpt-4o)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Export inferred types for convenience
export type SelectPromptTemplate = typeof promptTemplatesTable.$inferSelect
export type InsertPromptTemplate = typeof promptTemplatesTable.$inferInsert
