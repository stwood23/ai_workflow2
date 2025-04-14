/**
 * @description
 * Server actions for managing context snippets in the database.
 * Includes CRUD operations (Create, Read, Update, Delete) for snippets,
 * ensuring user ownership and handling specific constraints like unique names.
 *
 * @dependencies
 * - @clerk/nextjs/server: For authentication and retrieving the user ID.
 * - drizzle-orm: For database query building (eq, and).
 * - @/db/db: The Drizzle database instance.
 * - @/db/schema: Database schema definitions, specifically contextSnippetsTable.
 * - @/types: ActionState type definition.
 *
 * @key_features
 * - Create, read, update, and delete context snippets.
 * - Enforces user ownership for all operations.
 * - Validates snippet name format (`@\\w+`).
 * - Handles unique constraint violations gracefully during creation/update.
 *
 * @notes
 * - All functions are server actions (`"use server"` directive).
 * - Uses the ActionState pattern for return values.
 * - Assumes Clerk is configured for authentication.
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { PostgresError } from "postgres"

import { db } from "@/db/db"
import {
  InsertContextSnippet,
  SelectContextSnippet,
  contextSnippetsTable
} from "@/db/schema"
import { ActionState } from "@/types"

const SNIPPET_NAME_REGEX = /^@\w+$/

// --- Create Actions ---

export async function createContextSnippetAction(
  data: Omit<InsertContextSnippet, "userId" | "id" | "createdAt" | "updatedAt">
): Promise<ActionState<SelectContextSnippet>> {
  const authResult = await auth()
  const userId = authResult?.userId
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  // Validate name format
  if (!SNIPPET_NAME_REGEX.test(data.name)) {
    return {
      isSuccess: false,
      message: "Invalid snippet name format. Must start with '@' and contain only letters, numbers, or underscores."
    }
  }

  try {
    const [newSnippet] = await db
      .insert(contextSnippetsTable)
      .values({ ...data, userId })
      .returning()

    return {
      isSuccess: true,
      message: `Snippet "${newSnippet.name}" created successfully`,
      data: newSnippet
    }
  } catch (error) {
    console.error("Error creating context snippet:", error)
    // Check for unique constraint violation (PostgreSQL error code '23505')
    if (error instanceof PostgresError && error.code === "23505") {
      return {
        isSuccess: false,
        message: `A snippet with the name "${data.name}" already exists.`
      }
    }
    return { isSuccess: false, message: "Failed to create context snippet" }
  }
}

// --- Read Actions ---

export async function getContextSnippetsAction(): Promise<
  ActionState<SelectContextSnippet[]>
> {
  const authResult = await auth()
  const userId = authResult?.userId
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  try {
    const snippets = await db
      .select()
      .from(contextSnippetsTable)
      .where(eq(contextSnippetsTable.userId, userId))
      .orderBy(contextSnippetsTable.updatedAt) // Or createdAt, or name

    return {
      isSuccess: true,
      message: "Context snippets retrieved successfully",
      data: snippets
    }
  } catch (error) {
    console.error("Error getting context snippets:", error)
    return { isSuccess: false, message: "Failed to retrieve context snippets" }
  }
}

export async function getContextSnippetAction(
  id: string
): Promise<ActionState<SelectContextSnippet>> {
  const authResult = await auth()
  const userId = authResult?.userId
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  if (!id) {
    return { isSuccess: false, message: "Snippet ID is required" }
  }

  try {
    const [snippet] = await db
      .select()
      .from(contextSnippetsTable)
      .where(
        and(
          eq(contextSnippetsTable.id, id),
          eq(contextSnippetsTable.userId, userId)
        )
      )

    if (!snippet) {
      return { isSuccess: false, message: "Context snippet not found" }
    }

    return {
      isSuccess: true,
      message: "Context snippet retrieved successfully",
      data: snippet
    }
  } catch (error) {
    console.error("Error getting context snippet:", error)
    return { isSuccess: false, message: "Failed to retrieve context snippet" }
  }
}

export async function getContextSnippetByNameAction(
  name: string
): Promise<ActionState<SelectContextSnippet>> {
  const authResult = await auth()
  const userId = authResult?.userId
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  if (!name) {
    return { isSuccess: false, message: "Snippet name is required" }
  }

  try {
    const [snippet] = await db
      .select()
      .from(contextSnippetsTable)
      .where(
        and(
          eq(contextSnippetsTable.name, name),
          eq(contextSnippetsTable.userId, userId)
        )
      )

    // It's okay if not found during generation, might return success with null/empty data
    if (!snippet) {
       return {
        isSuccess: false, // Return false if snippet not found by name
        message: `Context snippet with name "${name}" not found.`
       }
    }

    return {
      isSuccess: true,
      message: "Context snippet retrieved successfully by name",
      data: snippet
    }
  } catch (error) {
    console.error("Error getting context snippet by name:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve context snippet by name"
    }
  }
}

// --- Update Actions ---

export async function updateContextSnippetAction(
  id: string,
  data: Partial<Omit<InsertContextSnippet, "userId" | "id">>
): Promise<ActionState<SelectContextSnippet>> {
  const authResult = await auth()
  const userId = authResult?.userId
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  if (!id) {
    return { isSuccess: false, message: "Snippet ID is required" }
  }

  // Validate name format if provided
  if (data.name && !SNIPPET_NAME_REGEX.test(data.name)) {
    return {
      isSuccess: false,
      message: "Invalid snippet name format. Must start with '@' and contain only letters, numbers, or underscores."
    }
  }

  try {
    const [updatedSnippet] = await db
      .update(contextSnippetsTable)
      .set({ ...data, updatedAt: new Date() }) // Ensure updatedAt is updated
      .where(
        and(
          eq(contextSnippetsTable.id, id),
          eq(contextSnippetsTable.userId, userId)
        )
      )
      .returning()

    if (!updatedSnippet) {
      return { isSuccess: false, message: "Context snippet not found or unauthorized" }
    }

    return {
      isSuccess: true,
      message: `Snippet "${updatedSnippet.name}" updated successfully`,
      data: updatedSnippet
    }
  } catch (error) {
    console.error("Error updating context snippet:", error)
    // Check for unique constraint violation (PostgreSQL error code '23505')
    if (
      error instanceof PostgresError &&
      error.code === "23505" &&
      data.name
    ) {
      return {
        isSuccess: false,
        message: `A snippet with the name "${data.name}" already exists.`
      }
    }
    return { isSuccess: false, message: "Failed to update context snippet" }
  }
}

// --- Delete Actions ---

export async function deleteContextSnippetAction(
  id: string
): Promise<ActionState<void>> {
  const authResult = await auth()
  const userId = authResult?.userId
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  if (!id) {
    return { isSuccess: false, message: "Snippet ID is required" }
  }

  try {
    const result = await db
      .delete(contextSnippetsTable)
      .where(
        and(
          eq(contextSnippetsTable.id, id),
          eq(contextSnippetsTable.userId, userId)
        )
      )
      .returning({ deletedId: contextSnippetsTable.id })

    // Check if any row was actually deleted by checking the length of the returned array
    if (result.length === 0) {
      return {
        isSuccess: false,
        message: "Context snippet not found or unauthorized"
      }
    }

    return {
      isSuccess: true,
      message: "Context snippet deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting context snippet:", error)
    return { isSuccess: false, message: "Failed to delete context snippet" }
  }
}
