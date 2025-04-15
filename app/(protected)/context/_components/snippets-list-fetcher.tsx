"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { getContextSnippetsAction } from "@/actions/db/context-snippets-actions"
import SnippetsList from "./snippets-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

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
 * - @/components/ui/alert: Used for displaying error messages.
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
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="size-4" />
        <AlertTitle>Error Loading Snippets</AlertTitle>
        <AlertDescription>
          {snippetsResult.message} Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  // Render the table structure and pass data to SnippetsList for the body
  return (
    <div className="overflow-hidden rounded-2xl">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#F0F0F7] text-left">
            <th className="text-muted-foreground-darker px-6 py-5 text-lg font-medium">
              Snippet Name
            </th>
            <th className="text-muted-foreground-darker px-6 py-5 text-lg font-medium">
              Content Preview
            </th>
            <th className="text-muted-foreground-darker px-6 py-5 text-lg font-medium">
              Last Updated
            </th>
            <th className="text-muted-foreground-darker px-6 py-5 text-left text-lg font-medium">
              Actions
            </th>
          </tr>
        </thead>
        {/* SnippetsList will render the tbody */}
        <SnippetsList snippets={snippetsResult.data} />
      </table>
    </div>
  )
}
