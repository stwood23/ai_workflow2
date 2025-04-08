/**
 * @description
 * Defines shared PostgreSQL enums used across multiple database schemas within the application.
 * This centralizes common type definitions for consistency.
 *
 * Key features:
 * - Defines `llmProviderEnum` for supported Large Language Model providers.
 * - Defines `workflowStatusEnum` for possible states of a workflow instance.
 *
 * @dependencies
 * - drizzle-orm/pg-core: Provides the `pgEnum` function for creating PostgreSQL enums.
 *
 * @notes
 * - These enums are imported and used within specific table schema definitions (e.g., `prompt_templates`, `workflow_instances`).
 * - They are exported via `db/schema/index.ts`.
 */
import { pgEnum } from "drizzle-orm/pg-core"

// Enum defining the supported LLM providers
export const llmProviderEnum = pgEnum("llm_provider", [
  "openai",
  "anthropic",
  "grok"
])

// Enum defining the possible statuses of a workflow instance
export const workflowStatusEnum = pgEnum("workflow_status", [
  "pending",
  "running",
  "completed",
  "failed"
])
