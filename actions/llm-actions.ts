/**
 * @description
 * Server actions related to Large Language Model (LLM) interactions,
 * such as optimizing prompts and generating titles. These actions encapsulate
 * calls to the LLM abstraction layer (`lib/llm.ts`) and include necessary
 * authorization checks.
 *
 * Key features:
 * - `optimizePromptAction`: Takes a raw prompt and returns an optimized version using an LLM.
 * - `generateTitleAction`: Takes a raw prompt and returns a generated title using an LLM.
 * - Authentication: Ensures actions are performed by logged-in users via Clerk.
 * - Error Handling: Returns standardized `ActionState` objects.
 *
 * @dependencies
 * - @clerk/nextjs/server: For authentication (`auth`).
 * - @/lib/llm: Contains the core LLM interaction logic (`optimizePromptWithLlm`, `generateTitleWithLlm`).
 * - @/types: Provides the `ActionState` type.
 *
 * @notes
 * - These actions are designed to be called from client components (e.g., modals).
 * - Logging is included for server-side debugging.
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { optimizePromptWithLlm, generateTitleWithLlm } from "@/lib/llm"
import { ActionState } from "@/types"

/**
 * Optimizes a given raw prompt using the LLM.
 * Requires authentication.
 *
 * @param rawPrompt - The raw prompt text provided by the user.
 * @returns An ActionState containing the optimized prompt string on success, or an error message on failure.
 */
export async function optimizePromptAction(
  rawPrompt: string
): Promise<ActionState<string>> {
  const { userId } = await auth()

  if (!userId) {
    return {
      isSuccess: false,
      message: "Authentication required to optimize prompts."
    }
  }

  if (!rawPrompt || typeof rawPrompt !== "string" || rawPrompt.trim() === "") {
    return { isSuccess: false, message: "Prompt content cannot be empty." }
  }

  try {
    const optimizedPrompt = await optimizePromptWithLlm(rawPrompt)
    return {
      isSuccess: true,
      message: "Prompt optimized successfully.",
      data: optimizedPrompt
    }
  } catch (error) {
    console.error("Error in optimizePromptAction:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to optimize prompt."
    }
  }
}

/**
 * Generates a title for a given raw prompt using the LLM.
 * Requires authentication.
 *
 * @param rawPrompt - The raw prompt text provided by the user.
 * @returns An ActionState containing the generated title string on success, or an error message on failure.
 */
export async function generateTitleAction(
  rawPrompt: string
): Promise<ActionState<string>> {
  const { userId } = await auth()

  if (!userId) {
    return {
      isSuccess: false,
      message: "Authentication required to generate titles."
    }
  }

   if (!rawPrompt || typeof rawPrompt !== "string" || rawPrompt.trim() === "") {
    return { isSuccess: false, message: "Prompt content cannot be empty." }
  }

  try {
    const generatedTitle = await generateTitleWithLlm(rawPrompt)
    return {
      isSuccess: true,
      message: "Title generated successfully.",
      data: generatedTitle
    }
  } catch (error) {
    console.error("Error in generateTitleAction:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to generate title."
    }
  }
}

// TODO: Add actions for document generation (generateDocumentAction),
// chat editing (editDocumentViaChatAction), prompt improvement suggestion
// (suggestPromptImprovementAction) etc. in subsequent steps.
