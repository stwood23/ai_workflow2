/**
 * @description
 * Client-side helper function to fetch context snippet suggestions for TipTap Mention autocomplete.
 * Includes debouncing to prevent excessive API calls during typing.
 *
 * @dependencies
 * - @/actions/db/context-snippets-actions: Server action to fetch snippets.
 * - @/db/schema: Types for context snippets (SelectContextSnippet).
 * - @/types: ActionState type.
 *
 * @key_features
 * - Fetches context snippets based on a query string.
 * - Debounces the fetch requests to improve performance.
 * - Handles the ActionState returned by the server action.
 */

"use client"

import { getContextSnippetsAction } from "@/actions/db/context-snippets-actions"
import { SelectContextSnippet } from "@/db/schema"

let debounceTimer: NodeJS.Timeout | null = null
const DEBOUNCE_DELAY = 300 // milliseconds

/**
 * Fetches context snippets based on the query, with debouncing.
 * @param query The search string (without the leading '@').
 * @returns A promise resolving to an array of matching snippets.
 */
export async function fetchSnippets(
  query: string
): Promise<SelectContextSnippet[]> {
  return new Promise(resolve => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(async () => {
      try {
        // Call the server action with the search query
        const result = await getContextSnippetsAction({ search: query })

        if (result.isSuccess) {
          resolve(result.data)
        } else {
          console.error(
            "Failed to fetch snippets:",
            result.message || "Unknown error"
          )
          resolve([]) // Return empty array on failure
        }
      } catch (error) {
        console.error("Error calling getContextSnippetsAction:", error)
        resolve([]) // Return empty array on unexpected error
      }
    }, DEBOUNCE_DELAY)
  })
}
