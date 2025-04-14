/**
 * @description
 * Defines the schema for the 'context_snippets' table using Drizzle ORM.
 * Context snippets are reusable pieces of text content identified by a unique name
 * scoped to a specific user, designed to be dynamically injected into prompts.
 *
 * @dependencies
 * - drizzle-orm/pg-core: For defining PostgreSQL table schemas (pgTable, uuid, text, timestamp, uniqueIndex).
 *
 * @key_features
 * - Stores snippet name, content, and user association.
 * - Includes standard timestamp fields (createdAt, updatedAt).
 * - Enforces unique snippet names per user via a unique index.
 *
 * @exports
 * - contextSnippetsTable: The Drizzle table definition.
 * - SelectContextSnippet: TypeScript type for selecting rows.
 * - InsertContextSnippet: TypeScript type for inserting rows.
 */

import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core"

export const contextSnippetsTable = pgTable(
  "context_snippets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(), // From Clerk auth
    name: text("name").notNull(), // e.g., "@company-info", must start with @
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  table => {
    return {
      // Ensures that each user can only have one snippet with a given name.
      userIdNameIdx: uniqueIndex("user_id_name_idx").on(
        table.userId,
        table.name
      )
    }
  }
)

export type SelectContextSnippet = typeof contextSnippetsTable.$inferSelect
export type InsertContextSnippet = typeof contextSnippetsTable.$inferInsert
