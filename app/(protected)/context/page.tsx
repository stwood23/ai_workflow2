/**
 * @description
 * The main page for managing Context Snippets.
 * Displays the page header, a button to create new snippets,
 * and the list of existing snippets fetched server-side with Suspense for loading states.
 *
 * @dependencies
 * - react: For Suspense.
 * - @/components/utilities/page-header: Displays the page title.
 * - ./_components/create-snippet-button: Button to trigger snippet creation.
 * - ./_components/snippets-list-fetcher: Fetches and displays the list or error state.
 * - ./_components/snippets-list-skeleton: Loading state for the snippets list.
 *
 * @notes
 * - This is a server component.
 * - Authentication is handled by Clerk middleware.
 */
"use server"

import { Suspense } from "react"
import PageHeader from "@/components/utilities/page-header"
import CreateSnippetButton from "./_components/create-snippet-button"
import SnippetsListFetcher from "./_components/snippets-list-fetcher"
import SnippetsListSkeleton from "./_components/snippets-list-skeleton"

export default async function ContextPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <PageHeader
          title="Context Snippets"
          description="Manage reusable pieces of context for your prompts."
        />
        <div className="flex items-center space-x-2">
          <CreateSnippetButton />
        </div>
      </div>

      <Suspense fallback={<SnippetsListSkeleton />}>
        <SnippetsListFetcher />
      </Suspense>
    </div>
  )
}
