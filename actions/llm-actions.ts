/**
 * @description
 * Server actions related to Large Language Model (LLM) interactions,
 * such as optimizing prompts, generating titles, generating documents from templates,
 * editing documents via chat, and suggesting prompt improvements. These actions encapsulate
 * calls to the LLM abstraction layer (`lib/llm.ts`) and include necessary
 * authorization checks and data handling (like snippet/placeholder injection).
 *
 * Key features:
 * - `optimizePromptAction`: Takes a raw prompt and returns an optimized version.
 * - `generateTitleAction`: Takes a raw prompt and returns a generated title.
 * - `generateDocumentAction`: Generates document content from a prompt template, injecting context snippets and placeholders.
 * - Authentication: Ensures actions are performed by logged-in users via Clerk.
 * - Error Handling: Returns standardized `ActionState` objects.
 * - Data Handling: Manages dynamic data injection (snippets, placeholders) before LLM calls.
 *
 * @dependencies
 * - @clerk/nextjs/server: For authentication (`auth`).
 * - @/lib/llm: Contains the core LLM interaction logic.
 * - @/types: Provides the `ActionState` type.
 * - @/db/schema: Provides database types (e.g., `LlmProviderEnum`, `SelectPromptTemplate`).
 * - @/actions/db/prompts-actions: To fetch prompt templates.
 * - @/actions/db/context-snippets-actions: To fetch context snippets by name.
 * - @/actions/db/documents-actions: To create document records (used in later steps).
 *
 * @notes
 * - These actions are designed to be called from client components (e.g., modals).
 * - Logging is included for server-side debugging.
 * - `generateDocumentAction` currently only generates content; DB saving implemented in Phase 5.
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import {
  optimizePromptWithLlm,
  generateTitleWithLlm,
  generateDocumentWithLlm
} from "@/lib/llm"
import { ActionState, LlmProviderEnum } from "@/types"
import { getPromptTemplateAction } from "@/actions/db/prompts-actions"
import { getContextSnippetByNameAction } from "@/actions/db/context-snippets-actions"
// import { createDocumentAction } from "@/actions/db/documents-actions" // To be uncommented in Phase 5
import { SelectPromptTemplate } from "@/db/schema" // Assuming SelectPromptTemplate is correctly exported
// import { SelectDocument } from "@/db/schema" // To be uncommented in Phase 5

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

// --- Document Actions ---

interface GenerateDocumentParams {
  promptTemplateId?: string
  rawPrompt?: string
  inputs: Record<string, string>
  llmProvider: LlmProviderEnum
  userId: string
  workflowInstanceId?: string
  workflowNodeId?: string
}

// Define a temporary return type for generated content + metadata
interface GeneratedDocumentResult {
  generatedContent: string
  generationMetadata: Record<string, any>
  originalTemplateId?: string // Keep track of template used
}

/**
 * Generates document content using an LLM, based on a prompt template or raw prompt.
 * Handles fetching the template, injecting context snippets (@name), replacing placeholders ({{name}}),
 * and calling the LLM. Saving the document is handled in a later step (Phase 5).
 * Requires authentication.
 *
 * @param params - Parameters for document generation.
 * @returns An ActionState containing the generated content and metadata on success, or an error message on failure.
 */
export async function generateDocumentAction(
  params: GenerateDocumentParams
): Promise<ActionState<GeneratedDocumentResult>> { // Updated return type
  const {
    promptTemplateId,
    rawPrompt,
    inputs,
    llmProvider,
    userId: paramUserId,
    workflowInstanceId,
    workflowNodeId
  } = params

  const { userId: authUserId } = await auth()

  if (!authUserId || authUserId !== paramUserId) {
    return { isSuccess: false, message: "Unauthorized." }
  }
  const userId = authUserId

  let promptText = ""
  let originalTemplate: SelectPromptTemplate | null = null

  // 1. Get the base prompt text
  if (promptTemplateId) {
    const templateResult = await getPromptTemplateAction(promptTemplateId)
    if (!templateResult.isSuccess) {
      return {
        isSuccess: false,
        message: `Failed to retrieve prompt template: ${templateResult.message}`
      }
    }
    promptText = templateResult.data.optimizedPrompt
    originalTemplate = templateResult.data
  } else if (rawPrompt) {
    promptText = rawPrompt
  } else {
    return {
      isSuccess: false,
      message: "Either promptTemplateId or rawPrompt must be provided."
    }
  }

  // 2. Parse and resolve Context Snippets (@name)
  const snippetRegex = /@(\w+)/g
  const snippetNames = [...new Set(Array.from(promptText.matchAll(snippetRegex), m => m[1]))]
  const snippetContents: Record<string, string> = {}
  const unresolvedSnippets: string[] = []

  if (snippetNames.length > 0) {
    console.log(`Found snippet references: ${snippetNames.join(', ')}`)
    for (const name of snippetNames) {
      const snippetResult = await getContextSnippetByNameAction(`@${name}`)
      if (snippetResult.isSuccess) {
        snippetContents[name] = snippetResult.data.content
      } else {
        console.warn(`Snippet @${name} not found or failed to fetch: ${snippetResult.message}`)
        unresolvedSnippets.push(`@${name}`)
      }
    }

    if (unresolvedSnippets.length > 0) {
      return {
        isSuccess: false,
        message: `Failed to resolve context snippets: ${unresolvedSnippets.join(", ")}. Please ensure they exist and are accessible.`
      }
    }

    promptText = promptText.replace(snippetRegex, (match, name) => {
      if (snippetContents[name]) {
        console.log(`Injecting snippet: @${name}`)
        return `\n--- Snippet: @${name} ---\n${snippetContents[name]}\n---\n`
      }
      console.warn(`Snippet @${name} was parsed but content not found during replacement.`)
      return match
    })
  }

  // 3. Replace Placeholders ({{name}})
  const placeholderRegex = /\{\{([^}]+)\}\}/g
  promptText = promptText.replace(placeholderRegex, (match, placeholderName) => {
    const key = placeholderName.trim()
    return inputs[key] !== undefined ? inputs[key] : match
  })

  const remainingPlaceholders = [...promptText.matchAll(placeholderRegex)].map(m => m[0])
  if (remainingPlaceholders.length > 0) {
      console.warn(`Unresolved placeholders found: ${remainingPlaceholders.join(', ')}. Proceeding with generation.`)
  }

  // 4. Call LLM API
  let generatedContent: string = ""
  let generationMetadata: Record<string, any> = {
    inputs,
    llmProviderUsed: llmProvider,
    promptTemplateId: originalTemplate?.id,
    resolvedPromptLength: promptText.length,
    resolvedSnippets: snippetNames,
    // Include workflow context if present
    workflowInstanceId: workflowInstanceId,
    workflowNodeId: workflowNodeId
  }

  try {
    console.log(`Generating document with provider: ${llmProvider}, prompt length: ${promptText.length}`)
    const llmResult = await generateDocumentWithLlm(promptText, llmProvider)
    generatedContent = llmResult.content
    if (llmResult.metadata) {
      generationMetadata = { ...generationMetadata, ...llmResult.metadata }
    }
  } catch (error) {
    console.error("Error calling LLM for document generation:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to generate document content."
    }
  }

  // 5. Save Document to DB (Commented out - To be implemented in Phase 5)
  /*
  try {
    const documentData = {
      userId: userId,
      promptTemplateId: originalTemplate?.id,
      workflowInstanceId: workflowInstanceId,
      workflowNodeId: workflowNodeId,
      title: originalTemplate?.title ? `${originalTemplate.title} Output` : "Generated Document",
      content: generatedContent,
      llmProviderUsed: llmProvider,
      generationMetadata: generationMetadata,
    }

    const createResult = await createDocumentAction(documentData)

    if (!createResult.isSuccess) {
      console.error("Failed to save generated document to DB:", createResult.message)
      return { isSuccess: false, message: `Document generated but failed to save: ${createResult.message}` }
    }

    console.log(`Document ${createResult.data.id} created successfully.`)
    return {
      isSuccess: true,
      message: "Document generated and saved successfully.",
      data: createResult.data
    }
  } catch (error) {
    console.error("Error saving generated document:", error)
    return { isSuccess: false, message: "Document generated but failed during saving." }
  }
  */

  // Return generated content and metadata directly (Phase 3.10 completion)
  console.log(`Document content generated successfully (DB save deferred to Phase 5).`)
  return {
      isSuccess: true,
      message: "Document content generated successfully.",
      data: {
          generatedContent: generatedContent,
          generationMetadata: generationMetadata,
          originalTemplateId: originalTemplate?.id
      }
  }
}

// TODO: Add actions for chat editing (editDocumentViaChatAction), prompt improvement suggestion
// (suggestPromptImprovementAction) etc. in subsequent steps.
// TODO: Uncomment document saving logic in Phase 5.
