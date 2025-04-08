/**
 * @description
 * Defines TypeScript types related to Large Language Model (LLM) interactions.
 * It includes the provider enum and placeholder interfaces for call options and responses.
 *
 * Key features:
 * - Exports the LlmProviderEnum from the database schema.
 * - Defines placeholder types for LLM call options and responses.
 *
 * @dependencies
 * - @/db/schema/enums: Provides the LlmProviderEnum.
 *
 * @notes
 * - These types are placeholders and will be refined as LLM integration is built.
 */
import { llmProviderEnum } from "@/db/schema/enums"

// Re-export the enum from the database schema for consistency
export const LlmProviderEnum = llmProviderEnum
export type LlmProviderEnum = (typeof llmProviderEnum.enumValues)[number]

// Placeholder for options passed to LLM calls (e.g., temperature, max tokens)
export interface LlmCallOptions {
  temperature?: number
  maxTokens?: number
  // Add other common options as needed
}

// Placeholder for the structure of a response from an LLM call
export interface LlmResponse {
  content: string
  finishReason?: string // e.g., 'stop', 'length'
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  // Add other relevant response fields
}
