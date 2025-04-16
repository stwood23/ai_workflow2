/**
 * @file lib/llm.ts
 * @description
 * This module provides an abstraction layer for interacting with various Large Language Model (LLM) APIs.
 * It centralizes the logic for making API calls, handling authentication, processing responses,
 * and performing LLM-based internal tasks like prompt optimization and title generation.
 *
 * Supports:
 * - OpenAI (GPT models)
 * - Anthropic (Claude models, including experimental prompt generation API)
 * - Grok (via OpenAI-compatible API endpoint)
 *
 * Key features:
 * - Generic function `callLlm` to interact with standard chat completion APIs (OpenAI, Anthropic, Grok).
 * - Specific helper functions:
 *   - `optimizePromptWithLlm`: Refines user prompt templates using the Anthropic Prompt Generation API primarily,
 *     falling back to a specified LLM provider/model with a system prompt.
 *   - `generateTitleWithLlm`: Creates concise titles for prompts using a specified LLM provider/model.
 * - Reads system prompts from the `/prompts` directory for fallback/specific tasks.
 * - Manages API keys and default model configurations via environment variables.
 *
 * @dependencies
 * - `openai`: Official OpenAI SDK for Node.js (also used for Grok compatibility).
 * - `@anthropic-ai/sdk`: Official Anthropic SDK for Node.js (for standard chat completions).
 * - `fs/promises`: For asynchronously reading system prompt files.
 * - `path`: For constructing file paths reliably.
 * - `@/types`: Includes `ActionState` for standardized function return types.
 * - `@/types/llm-types`: Defines `LlmProviderEnum`.
 *
 * @environment_variables
 * - `OPENAI_API_KEY`: Required for OpenAI functionality.
 * - `ANTHROPIC_API_KEY`: Required for Anthropic functionality (both chat and prompt generation).
 * - `GROK_API_KEY`: Required for Grok functionality.
 * - `INTERNAL_LLM_PROVIDER`: Optional. Default provider ('openai') used for fallback/internal tasks if not set.
 * - `INTERNAL_LLM_MODEL`: Optional. Default model ('gpt-4o') used for fallback/internal tasks if not set.
 *
 * @notes
 * - The Anthropic Prompt Generation API is experimental (`/v1/experimental/generate_prompt`) and requires a specific beta header. Its behavior and availability might change.
 * - `optimizePromptWithLlm` prioritizes the Anthropic API. If it fails (e.g., key missing, network error, API error), it falls back to using `callLlm` with the `prompts/optimize-prompt.txt` system prompt.
 * - Placeholder preservation (like `{{placeholder}}`) in `optimizePromptWithLlm` relies on the behavior of the Anthropic API or the instructions in the fallback system prompt.
 * - Ensure all necessary API keys are correctly configured in your environment. Warnings are logged if keys are missing.
 */

import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"
import fs from "fs/promises"
import path from "path"
import { LlmProviderEnum } from "@/types/llm-types"
import { ActionState } from "@/types"

// Type definition for the expected structure of Anthropic prompt generation API response messages
interface AnthropicGeneratedMessage {
  role: "user" | "assistant"
  content: Array<{ type: string; text: string }>
}

// Type definition for the expected structure of the Anthropic prompt generation API response
interface AnthropicPromptGenerationResponse {
  messages: AnthropicGeneratedMessage[]
  system?: string // Optional system prompt
  // Potentially other fields like usage, etc., but we only need messages for now
}

// --- Client Initialization ---

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
    "ANTHROPIC_API_KEY is not set. Anthropic LLM chat features will not work."
  )
  // Note: We still might try the prompt generation API if the key exists,
  // but the standard chat client won't be initialized.
}

let grok: OpenAI | null = null
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

// Default models for standard chat completions (can be overridden by options in callLlm)
const DEFAULT_MODELS = {
  openai: "gpt-4o",
  anthropic: "claude-3-haiku-20240307", // Default for standard chat
  grok: "grok-2" // Adjust if Grok has a different preferred default
}

// --- Core LLM Functions ---

/**
 * @function readSystemPrompt
 * @description Reads a system prompt file from the `/prompts` directory.
 * It assumes the prompt content starts after the first JSDoc-style block comment (`/** ... *\/`).
 * If no such comment block is found, it returns the entire trimmed file content.
 * @param {string} filename - The name of the prompt file (e.g., "optimize-prompt.txt").
 * @returns {Promise<string>} The content of the system prompt file.
 * @throws {Error} If the file cannot be read (e.g., does not exist, permissions error).
 * @async
 */
export async function readSystemPrompt(filename: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "prompts", filename)
    const content = await fs.readFile(filePath, "utf-8")
    // Find the end of the first doc block /** ... */ and take everything after it
    const docBlockEndIndex = content.indexOf("*/")
    if (docBlockEndIndex !== -1) {
      return content.substring(docBlockEndIndex + 2).trim()
    }
    // Fallback if no doc block comment is found
    console.warn(
      `No JSDoc block comment found in system prompt file: ${filename}. Returning full content.`
    )
    return content.trim()
  } catch (error) {
    console.error(`Error reading system prompt file: ${filename}`, error)
    throw new Error(`Failed to read system prompt: ${filename}`)
  }
}

/**
 * @function callLlm
 * @description Calls the specified LLM provider's chat completion API with the given prompts.
 * Supports OpenAI, Anthropic (standard chat), and Grok.
 *
 * @param {string} prompt - The user prompt text.
 * @param {LlmProviderEnum} provider - The LLM provider to use.
 * @param {object} [options] - Optional configuration for the API call.
 * @param {string} [options.model] - The specific model to use (overrides the default for the provider).
 * @param {number} [options.temperature] - Sampling temperature (default: 0.7).
 * @param {string} [options.systemPrompt] - An optional system prompt to provide context or instructions.
 * @returns {Promise<ActionState<string>>} An ActionState object containing the success status, a message, and the LLM's response text on success, or an error message on failure.
 * @throws Does not throw directly, but returns `ActionState` with `isSuccess: false` on errors.
 * @async
 */
export async function callLlm(
  prompt: string,
  provider: LlmProviderEnum,
  options?: { model?: string; temperature?: number; systemPrompt?: string }
): Promise<ActionState<string>> {
  const systemPrompt = options?.systemPrompt
  const userPrompt = prompt
  const temperature = options?.temperature ?? 0.7
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
              ? [{ role: "system" as const, content: systemPrompt }]
              : []),
            { role: "user" as const, content: userPrompt }
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
            message:
              "Anthropic API key not configured (required for chat completions)."
          }
        }
        const message = await anthropic.messages.create({
          model: model || DEFAULT_MODELS.anthropic,
          ...(systemPrompt && { system: systemPrompt }),
          messages: [{ role: "user" as const, content: userPrompt }],
          max_tokens: 4096, // Consider making this configurable
          temperature: temperature
        })
        // Assuming response content is primarily text blocks
        const responseContent = message.content
          .map((block: Anthropic.ContentBlock) =>
            "text" in block ? block.text : ""
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
          message: "Anthropic chat call successful.",
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
        const completion = await grok.chat.completions.create({
          model: model || DEFAULT_MODELS.grok,
          messages: [
            ...(systemPrompt
              ? [{ role: "system" as const, content: systemPrompt }]
              : []),
            { role: "user" as const, content: userPrompt }
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

      default: {
        // Type safety should prevent this, but added for robustness
        const exhaustiveCheck: never = provider
        console.error(`Unhandled LLM Provider: ${exhaustiveCheck}`)
        return {
          isSuccess: false,
          message: `Provider '${provider}' not supported.`
        }
      }
    }
  } catch (error: any) {
    console.error(`Error calling ${provider} API:`, error)
    let errorMessage = `Failed to get response from ${provider}.`
    if (error.response) {
      // Handle errors based on fetch response structure
      errorMessage = `API Error from ${provider}: ${error.response.status} ${error.response.statusText}. Check console for details.`
    } else if (error instanceof OpenAI.APIError) {
      errorMessage = `OpenAI API Error: ${error.status} ${error.name} - ${error.message}`
    } else if (error instanceof Anthropic.APIError) {
      errorMessage = `Anthropic API Error: ${error.status} ${error.name} - ${error.message}`
    } else if (error instanceof Error) {
      errorMessage = `Error during ${provider} call: ${error.message}`
    }
    return { isSuccess: false, message: errorMessage }
  }
}

/**
 * @function callAnthropicPromptGenerator
 * @description Calls the experimental Anthropic Prompt Generation API.
 * This function makes a direct fetch request, as the endpoint might not be in the stable SDK.
 * It requires the ANTHROPIC_API_KEY environment variable.
 *
 * @param {string} taskDescription - The description of the prompt's purpose (user's raw prompt).
 * @param {string} [targetModel] - Optional: The model the generated prompt is intended for (e.g., "claude-3-opus-20240229"). Currently informational for Anthropic.
 * @returns {Promise<ActionState<string>>} An ActionState object. On success, `data` contains the generated prompt text extracted from the API response. On failure, `isSuccess` is false and `message` contains error details.
 * @throws Does not throw directly, returns `ActionState` with `isSuccess: false` on errors.
 * @async
 * @privateRemarks This is intended as an internal helper for `optimizePromptWithLlm`.
 * It specifically extracts the 'user' role message content as the primary generated prompt.
 * Handles potential errors like missing API key, network issues, non-200 responses, or unexpected response format.
 */
async function callAnthropicPromptGenerator(
  taskDescription: string,
  targetModel?: string
): Promise<ActionState<string>> {
  if (!ANTHROPIC_API_KEY) {
    return {
      isSuccess: false,
      message: "Anthropic API key is not configured for prompt generation."
    }
  }

  const apiUrl = "https://api.anthropic.com/v1/experimental/generate_prompt"
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01", // Standard version header
    "anthropic-beta": "prompt-tools-2025-04-02" // Required beta header for this endpoint
  }
  const body = JSON.stringify({
    task: taskDescription,
    ...(targetModel && { target_model: targetModel }) // Include target_model if provided
  })

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: body
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(
        `Anthropic Prompt Generation API Error (${response.status}): ${errorBody}`
      )
      return {
        isSuccess: false,
        message: `Anthropic Prompt Generation API request failed with status ${response.status}. Check logs.`
      }
    }

    const data: AnthropicPromptGenerationResponse = await response.json()

    // Extract the prompt, prioritizing the first 'user' message content
    const userMessage = data.messages?.find(msg => msg.role === "user")
    const generatedPrompt = userMessage?.content
      ?.map(contentBlock => contentBlock.text)
      .join("")

    if (!generatedPrompt) {
      console.warn(
        "Anthropic Prompt Generation API response did not contain expected user message content.",
        data
      )
      return {
        isSuccess: false,
        message:
          "Failed to extract generated prompt from Anthropic API response."
      }
    }

    // Consider if we need to handle the 'system' prompt or 'assistant' prefill if present in the future.
    // For now, we just return the main user prompt.

    return {
      isSuccess: true,
      message: "Anthropic prompt generation successful.",
      data: generatedPrompt.trim()
    }
  } catch (error: any) {
    console.error("Error calling Anthropic Prompt Generation API:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? `Network or other error calling Anthropic Prompt Generation: ${error.message}`
          : "An unknown error occurred during Anthropic prompt generation."
    }
  }
}

// --- Specific Helper Functions ---

/**
 * @function optimizePromptWithLlm
 * @description Optimizes a given raw prompt template.
 * Primarily attempts to use the Anthropic Prompt Generation API. If that fails
 * (e.g., API key missing, network error, API error), it falls back to using a
 * configured LLM provider (`DEFAULT_INTERNAL_PROVIDER`, `DEFAULT_INTERNAL_MODEL`)
 * with the system prompt defined in `prompts/optimize-prompt.txt`.
 *
 * @param {string} rawPrompt - The user's raw prompt template to be optimized.
 * @returns {Promise<string>} The optimized prompt template text.
 * @throws {Error} If both the primary Anthropic API call and the fallback LLM call fail.
 *                 The error message will indicate the failure reason(s).
 * @async
 * @example
 * const optimized = await optimizePromptWithLlm("Write a blog post about {{topic}}.");
 * console.log(optimized); // Outputs the enhanced prompt template
 */
export async function optimizePromptWithLlm(
  rawPrompt: string
): Promise<string> {
  // --- Primary Method: Anthropic Prompt Generation API ---
  console.log("Attempting prompt optimization via Anthropic Generate API...")
  const anthropicResult = await callAnthropicPromptGenerator(rawPrompt) // Add targetModel if needed

  if (anthropicResult.isSuccess) {
    console.log("Anthropic Generate API successful.")
    return anthropicResult.data
  }

  // --- Fallback Method: Standard LLM Call ---
  console.warn(
    `Anthropic Prompt Generation API failed: ${anthropicResult.message}. Falling back to standard LLM optimization.`
  )

  try {
    // Read the fallback system prompt
    const systemPrompt = await readSystemPrompt("optimize-prompt.txt")

    // Call the configured fallback LLM
    console.log(
      `Using fallback LLM: ${DEFAULT_INTERNAL_PROVIDER} (${DEFAULT_INTERNAL_MODEL})`
    )
    const fallbackResult = await callLlm(rawPrompt, DEFAULT_INTERNAL_PROVIDER, {
      systemPrompt: systemPrompt,
      model: DEFAULT_INTERNAL_MODEL,
      temperature: 0.3 // Lower temperature for more deterministic optimization
    })

    if (!fallbackResult.isSuccess) {
      // If fallback also fails, throw a comprehensive error
      throw new Error(
        `Prompt optimization failed. Anthropic API Error: ${anthropicResult.message}. Fallback LLM Error: ${fallbackResult.message}`
      )
    }

    console.log("Fallback LLM optimization successful.")
    return fallbackResult.data
  } catch (error) {
    // Catch errors from readSystemPrompt or if callLlm itself throws unexpectedly (though it shouldn't)
    console.error("Error during fallback prompt optimization:", error)
    // Ensure a clear error is thrown if anything in the fallback path fails
    throw new Error(
      `Prompt optimization failed. Anthropic API Error: ${anthropicResult.message}. Fallback process error: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * @function generateTitleWithLlm
 * @description Generates a concise title for a given raw prompt using a configured LLM
 * (`DEFAULT_INTERNAL_PROVIDER`, `DEFAULT_INTERNAL_MODEL`) and the system prompt
 * defined in `prompts/generate-title.txt`.
 *
 * @param {string} rawPrompt - The user's raw prompt template for which to generate a title.
 * @returns {Promise<string>} The generated title text (cleaned of potential surrounding quotes).
 * @throws {Error} If reading the system prompt fails or the LLM call fails.
 *                 The error message will indicate the failure reason.
 * @async
 * @example
 * const title = await generateTitleWithLlm("Create a marketing plan for a new SaaS product.");
 * console.log(title); // Outputs a concise title like "SaaS Product Marketing Plan"
 */
export async function generateTitleWithLlm(rawPrompt: string): Promise<string> {
  try {
    const systemPrompt = await readSystemPrompt("generate-title.txt")
    const result = await callLlm(rawPrompt, DEFAULT_INTERNAL_PROVIDER, {
      systemPrompt: systemPrompt,
      model: DEFAULT_INTERNAL_MODEL,
      temperature: 0.5 // Moderate temperature for creative but relevant titles
    })

    if (!result.isSuccess) {
      // Throw error if the LLM call wasn't successful
      throw new Error(`Failed to generate title via LLM: ${result.message}`)
    }

    // Basic cleanup - remove potential quotes LLM might add around the title
    const cleanedTitle = result.data.replace(/^[\"'](.*)[\"']$/g, "$1").trim()
    return cleanedTitle
  } catch (error) {
    console.error("Error generating title with LLM:", error)
    // Re-throw error from readSystemPrompt or the error thrown above
    throw new Error(
      `Failed to generate title: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// TODO: Add functions for document generation, editing, etc. as needed in future milestones.
