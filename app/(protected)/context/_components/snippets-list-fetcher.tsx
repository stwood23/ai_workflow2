"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { getContextSnippetsAction } from "@/actions/db/context-snippets-actions"
import SnippetsList from "./snippets-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * @description
 * Fetches context snippets data for the current user.
 * This component acts as an async boundary for Suspense.
 * It fetches the data and then renders the `SnippetsList` component.
 *
 * @dependencies
 * - @clerk/nextjs/server: For getting the userId (used internally by action).
 * - @/actions/db/context-snippets-actions: Action to fetch snippets.
 * - ./snippets-list: Component to display the snippets.
 * - @/components/ui/card: Used for displaying error messages.
 *
 * @notes
 * - Handles the case where the user is not authenticated (via middleware).
 * - Handles the case where the action fails to fetch data.
 * - The action `getContextSnippetsAction` retrieves the userId internally.
 */
export default async function SnippetsListFetcher() {
  // Although auth() is called internally by the action, we might still check
  // for robustness or future use, but it's not strictly needed for the action call itself.
  // const { userId } = await auth();
  // if (!userId) { ... return error card ... }

  // Fetch context snippets using the server action.
  // The action handles retrieving the userId internally via auth().
  const snippetsResult = await getContextSnippetsAction()

  if (!snippetsResult.isSuccess) {
    return (
      <Card className="border-destructive mt-4">
        <CardHeader>
          <CardTitle className="text-destructive">
            Error Loading Snippets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{snippetsResult.message}</p>
          <p>Please try refreshing the page.</p>
        </CardContent>
      </Card>
    )
  }

  // Handles the empty state within the SnippetsList component
  return <SnippetsList snippets={snippetsResult.data} />
}
