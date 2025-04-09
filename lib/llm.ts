/**
 * @description
 * This module provides an abstraction layer for interacting with various Large Language Model (LLM) APIs.
 * It centralizes the logic for making API calls, handling authentication, and processing responses.
 * Currently supports OpenAI, Anthropic, and Grok (via OpenAI-compatible API).
 *
 * Key features:
 * - Generic function `callLlm` to interact with LLM APIs.
 * - Specific helper functions for internal tasks:
 *   - `optimizePromptWithLlm`: Refines user prompt templates.
 *   - `generateTitleWithLlm`: Creates concise titles for prompts.
 * - Reads system prompts from the /prompts directory.
 * - Manages API keys and model configurations via environment variables.
 *
 * @dependencies
 * - openai: Official OpenAI SDK for Node.js (also used for Grok compatibility).
 * - @anthropic-ai/sdk: Official Anthropic SDK for Node.js.
 * - fs/promises: For asynchronously reading system prompt files.
 * - path: For constructing file paths reliably.
 * - @/types: Includes ActionState and LlmProviderEnum.
 * - @/db/schema/enums: Defines LlmProviderEnum.
 *
 * @notes
 * - Ensure necessary environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY, GROK_API_KEY) are set.
 * - Error handling focuses on catching API errors and missing configurations.
 * - Placeholder preservation is critical for optimizePromptWithLlm and relies on the system prompt's instructions.
 */

import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk" // Added for Anthropic
import fs from "fs/promises"
import path from "path"
import { LlmProviderEnum } from "@/types/llm-types" // Changed import source
import { ActionState } from "@/types" // Added ActionState

// Initialize OpenAI client
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const GROK_API_KEY = process.env.GROK_API_KEY

let openai: OpenAI | null = null
if (OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY })
} else {
  console.warn("OPENAI_API_KEY is not set. OpenAI LLM features will not work.")
}

let anthropic: Anthropic | null = null
if (ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
} else {
  console.warn(
    "ANTHROPIC_API_KEY is not set. Anthropic LLM features will not work."
  )
}

let grok: OpenAI | null = null // Use OpenAI client for Grok
if (GROK_API_KEY) {
  grok = new OpenAI({
    apiKey: GROK_API_KEY,
    baseURL: "https://api.x.ai/v1"
  })
} else {
  console.warn("GROK_API_KEY is not set. Grok LLM features will not work.")
}

// --- Configuration ---

const DEFAULT_INTERNAL_PROVIDER: LlmProviderEnum =
  (process.env.INTERNAL_LLM_PROVIDER as LlmProviderEnum) || "openai"
const DEFAULT_INTERNAL_MODEL = process.env.INTERNAL_LLM_MODEL || "gpt-4o"

// Default models (can be overridden by options in callLlm)
const DEFAULT_MODELS = {
  openai: "gpt-4o",
  anthropic: "claude-3-haiku-20240307",
  grok: "grok-2" // Adjust if Grok has a different preferred default
}

// --- Core LLM Call Function ---

/**
 * Reads a system prompt file from the /prompts directory.
 * @param filename - The name of the prompt file (e.g., "optimize-prompt.txt").
 * @returns The content of the system prompt file.
 * @throws If the file cannot be read.
 */
export async function readSystemPrompt(filename: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "prompts", filename)
    const content = await fs.readFile(filePath, "utf-8")
    // Find the end of the doc block /** ... */ and take everything after it
    const docBlockEndIndex = content.indexOf("*/")
    if (docBlockEndIndex !== -1) {
      return content.substring(docBlockEndIndex + 2).trim()
    }
    // Fallback if no doc block comment is found (though there should be one)
    return content.trim()
  } catch (error) {
    console.error(`Error reading system prompt file: ${filename}`, error)
    throw new Error(`Failed to read system prompt: ${filename}`)
  }
}

/**
 * Calls the specified LLM provider with the given prompts.
 * Currently only supports OpenAI.
 *
 * @param systemPrompt - The system prompt text.
 * @param userPrompt - The user prompt text.
 * @param provider - The LLM provider to use (defaults to internal setting).
 * @param model - The specific model to use (defaults to internal setting).
 * @returns The LLM's response text.
 * @throws If the API call fails or the provider/client is not configured.
 */
export async function callLlm(
  prompt: string,
  provider: LlmProviderEnum,
  options?: { model?: string; temperature?: number; systemPrompt?: string }
): Promise<ActionState<string>> {
  const systemPrompt = options?.systemPrompt
  const userPrompt = prompt
  const temperature = options?.temperature ?? 0.7 // Default temperature
  const model = options?.model // Use provided model or default later

  try {
    switch (provider) {
      case "openai": {
        if (!openai) {
          return {
            isSuccess: false,
            message: "OpenAI API key not configured."
          }
        }
        const completion = await openai.chat.completions.create({
          model: model || DEFAULT_MODELS.openai,
          messages: [
            ...(systemPrompt
              ? [
                  {
                    role: "system" as const, // Explicit type
                    content: systemPrompt
                  }
                ]
              : []),
            { role: "user" as const, content: userPrompt } // Explicit type
          ],
          temperature: temperature
        })
        const responseContent = completion.choices[0]?.message?.content
        if (!responseContent) {
          return {
            isSuccess: false,
            message: "OpenAI LLM returned an empty response."
          }
        }
        return {
          isSuccess: true,
          message: "OpenAI call successful.",
          data: responseContent.trim()
        }
      }

      case "anthropic": {
        if (!anthropic) {
          return {
            isSuccess: false,
            message: "Anthropic API key not configured."
          }
        }
        const message = await anthropic.messages.create({
          model: model || DEFAULT_MODELS.anthropic,
          ...(systemPrompt && { system: systemPrompt }), // Add system prompt if provided
          messages: [{ role: "user" as const, content: userPrompt }],
          max_tokens: 4096, // Example max tokens, adjust as needed
          temperature: temperature
        })
        // Anthropic response structure might differ, ensure we extract correctly
        // Assuming response is in message.content which is an array of blocks
        const responseContent = message.content
          .map(
            (
              block: Anthropic.ContentBlock // Added type for block
            ) => ("text" in block ? block.text : "")
          )
          .join("")

        if (!responseContent) {
          return {
            isSuccess: false,
            message: "Anthropic LLM returned an empty response."
          }
        }
        return {
          isSuccess: true,
          message: "Anthropic call successful.",
          data: responseContent.trim()
        }
      }

      case "grok": {
        if (!grok) {
          return {
            isSuccess: false,
            message: "Grok API key not configured."
          }
        }
        // Use the Grok-configured OpenAI client
        const completion = await grok.chat.completions.create({
          model: model || DEFAULT_MODELS.grok,
          messages: [
            ...(systemPrompt
              ? [
                  {
                    role: "system" as const, // Explicit type
                    content: systemPrompt
                  }
                ]
              : []),
            { role: "user" as const, content: userPrompt } // Explicit type
          ],
          temperature: temperature
        })
        const responseContent = completion.choices[0]?.message?.content
        if (!responseContent) {
          return {
            isSuccess: false,
            message: "Grok LLM returned an empty response."
          }
        }
        return {
          isSuccess: true,
          message: "Grok call successful.",
          data: responseContent.trim()
        }
      }

      default:
        // Ensures switch is exhaustive - handle potential future providers
        // This should not be hit if LlmProviderEnum is used correctly
        console.warn(`Unsupported LLM Provider: ${provider}`)
        return {
          isSuccess: false,
          message: `Provider '${provider}' not supported.`
        }
    }
  } catch (error: any) {
    console.error(`Error calling ${provider} API:`, error)
    // Provide more specific error messages if possible by inspecting 'error'
    let errorMessage = `Failed to get response from ${provider}.`
    if (
      error instanceof OpenAI.APIError ||
      error instanceof Anthropic.APIError
    ) {
      errorMessage = `API Error from ${provider}: ${error.status} ${error.name} - ${error.message}`
    } else if (error instanceof Error) {
      errorMessage = `Error during ${provider} call: ${error.message}`
    }
    return { isSuccess: false, message: errorMessage }
  }
}

// --- Specific Helper Functions ---

/**
 * Optimizes a given raw prompt using the predefined optimization system prompt.
 * @param rawPrompt - The user's raw prompt template.
 * @returns The optimized prompt template text.
 * @throws If reading the system prompt or calling the LLM fails.
 */
export async function optimizePromptWithLlm(
  rawPrompt: string
): Promise<string> {
  try {
    const systemPrompt = await readSystemPrompt("optimize-prompt.txt")
    const result = await callLlm(rawPrompt, DEFAULT_INTERNAL_PROVIDER, {
      systemPrompt: systemPrompt,
      model: DEFAULT_INTERNAL_MODEL
    })
    if (!result.isSuccess) {
      throw new Error(result.message)
    }
    return result.data
  } catch (error) {
    console.error("Error optimizing prompt with LLM:", error)
    // Re-throw or handle more specifically if needed
    throw new Error(
      error instanceof Error ? error.message : "Failed to optimize prompt."
    )
  }
}

/**
 * Generates a concise title for a given raw prompt using the predefined title generation system prompt.
 * @param rawPrompt - The user's raw prompt template.
 * @returns The generated title text.
 * @throws If reading the system prompt or calling the LLM fails.
 */
export async function generateTitleWithLlm(rawPrompt: string): Promise<string> {
  try {
    const systemPrompt = await readSystemPrompt("generate-title.txt")
    const result = await callLlm(rawPrompt, DEFAULT_INTERNAL_PROVIDER, {
      systemPrompt: systemPrompt,
      model: DEFAULT_INTERNAL_MODEL
    })
    if (!result.isSuccess) {
      throw new Error(result.message)
    }
    // Basic cleanup - remove potential quotes LLM might add
    const cleanedTitle = result.data.replace(/^[\\"']|[\\"']$/g, "")
    return cleanedTitle
  } catch (error) {
    console.error("Error generating title with LLM:", error)
    // Re-throw or handle more specifically if needed
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate title."
    )
  }
}

// TODO: Add functions for document generation, editing, etc. as needed in later milestones.
