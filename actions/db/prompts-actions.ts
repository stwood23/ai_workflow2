/**
 * @description
 * Server actions for CRUD operations on the `prompt_templates` table.
 * These actions encapsulate database interactions for managing prompt templates,
 * ensuring user ownership and consistent error handling.
 *
 * Key features:
 * - Create, Read, Update, Delete (CRUD) operations for prompt templates.
 * - Enforces user ownership by checking `userId` from Clerk authentication.
 * - Uses the `ActionState` type for standardized return values.
 * - Handles potential database errors gracefully.
 *
 * @dependencies
 * - @clerk/nextjs/server: Provides the `auth` helper to get the current user ID.
 * - drizzle-orm: Used for database query building (eq, and).
 * - @/db/db: The Drizzle ORM database instance.
 * - @/db/schema: Contains the `promptTemplatesTable` definition and inferred types.
 * - @/types: Provides the `ActionState` interface.
 *
 * @notes
 * - All actions require the user to be authenticated.
 * - Input validation (e.g., for prompt text length, title format) might be added here or in calling components/actions.
 * - These actions are intended to be called from other Server Components or Server Actions.
 */
"use server"

import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"

import { db } from "@/db/db"
import {
  InsertPromptTemplate,
  SelectPromptTemplate,
  promptTemplatesTable
} from "@/db/schema"
import { ActionState } from "@/types"

/**
 * Creates a new prompt template for the currently authenticated user.
 * @param data - The data for the new prompt template (excluding userId).
 * @returns ActionState<SelectPromptTemplate> - The state containing the result of the action.
 */
export async function createPromptTemplateAction(
  data: Omit<InsertPromptTemplate, "userId">
): Promise<ActionState<SelectPromptTemplate>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  try {
    const [newPrompt] = await db
      .insert(promptTemplatesTable)
      .values({ ...data, userId })
      .returning()

    if (!newPrompt) {
      return { isSuccess: false, message: "Failed to create prompt template." }
    }

    return {
      isSuccess: true,
      message: "Prompt template created successfully.",
      data: newPrompt
    }
  } catch (error) {
    console.error("Error creating prompt template:", error)
    return { isSuccess: false, message: "An unexpected error occurred." }
  }
}

/**
 * Retrieves all prompt templates for the currently authenticated user.
 * @returns ActionState<SelectPromptTemplate[]> - The state containing the list of templates or an error.
 */
export async function getPromptTemplatesAction(): Promise<
  ActionState<SelectPromptTemplate[]>
> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  try {
    const prompts = await db
      .select()
      .from(promptTemplatesTable)
      .where(eq(promptTemplatesTable.userId, userId))
      .orderBy(promptTemplatesTable.updatedAt)

    return {
      isSuccess: true,
      message: "Prompt templates retrieved successfully.",
      data: prompts
    }
  } catch (error) {
    console.error("Error retrieving prompt templates:", error)
    return { isSuccess: false, message: "An unexpected error occurred." }
  }
}

/**
 * Retrieves a single prompt template by its ID for the currently authenticated user.
 * @param id - The ID of the prompt template to retrieve.
 * @returns ActionState<SelectPromptTemplate> - The state containing the template or an error.
 */
export async function getPromptTemplateAction(
  id: string
): Promise<ActionState<SelectPromptTemplate>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  try {
    const [prompt] = await db
      .select()
      .from(promptTemplatesTable)
      .where(
        and(eq(promptTemplatesTable.id, id), eq(promptTemplatesTable.userId, userId))
      )

    if (!prompt) {
      return { isSuccess: false, message: "Prompt template not found or unauthorized." }
    }

    return {
      isSuccess: true,
      message: "Prompt template retrieved successfully.",
      data: prompt
    }
  } catch (error) {
    console.error("Error retrieving prompt template:", error)
    return { isSuccess: false, message: "An unexpected error occurred." }
  }
}

/**
 * Updates an existing prompt template for the currently authenticated user.
 * @param id - The ID of the prompt template to update.
 * @param data - The partial data to update the template with.
 * @returns ActionState<SelectPromptTemplate> - The state containing the updated template or an error.
 */
export async function updatePromptTemplateAction(
  id: string,
  data: Partial<Omit<InsertPromptTemplate, "id" | "userId">>
): Promise<ActionState<SelectPromptTemplate>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  try {
    // Ensure updatedAt is updated automatically by the database trigger
    const [updatedPrompt] = await db
      .update(promptTemplatesTable)
      .set(data)
      .where(
        and(eq(promptTemplatesTable.id, id), eq(promptTemplatesTable.userId, userId))
      )
      .returning()

    if (!updatedPrompt) {
      return { isSuccess: false, message: "Prompt template not found or unauthorized." }
    }

    return {
      isSuccess: true,
      message: "Prompt template updated successfully.",
      data: updatedPrompt
    }
  } catch (error) {
    console.error("Error updating prompt template:", error)
    return { isSuccess: false, message: "An unexpected error occurred." }
  }
}

/**
 * Deletes a prompt template by its ID for the currently authenticated user.
 * @param id - The ID of the prompt template to delete.
 * @returns ActionState<void> - The state indicating success or failure.
 */
export async function deletePromptTemplateAction(
  id: string
): Promise<ActionState<void>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  try {
    const deletedPrompts = await db
      .delete(promptTemplatesTable)
      .where(
        and(eq(promptTemplatesTable.id, id), eq(promptTemplatesTable.userId, userId))
      )
      .returning({ id: promptTemplatesTable.id })

    // Check if any row was actually deleted
    if (deletedPrompts.length === 0) {
      return { isSuccess: false, message: "Prompt template not found or unauthorized." }
    }

    return { isSuccess: true, message: "Prompt template deleted successfully.", data: undefined }
  } catch (error) {
    console.error("Error deleting prompt template:", error)
    return { isSuccess: false, message: "An unexpected error occurred." }
  }
}
