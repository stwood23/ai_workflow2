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
// import PageHeader from "@/components/utilities/page-header" // Removed
import CreateSnippetButton from "./_components/create-snippet-button" // Ensure this is imported
import SnippetsListFetcher from "./_components/snippets-list-fetcher"
import SnippetsListSkeleton from "./_components/snippets-list-skeleton"
// Remove unused Button and PlusCircle imports if only used in the button below
// import { Button } from "@/components/ui/button"
// import { PlusCircle } from "lucide-react"

export default async function ContextPage() {
  // Return content directly, no outer layout div needed
  return (
    <>
      {/* Header Section */}
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-[#23203A]">Context Snippets</h1>

        {/* Render the actual CreateSnippetButton component */}
        <CreateSnippetButton />

        {/* Remove the standalone Button */}
        {/*
        <Button className="bg-gradient-to-r from-[#22965A] to-[#2AB090] px-8 py-6 text-base font-bold shadow-[0_4px_16px_rgba(34,150,90,0.16)] hover:shadow-[0_8px_32px_rgba(34,150,90,0.24)]">
          <PlusCircle size={20} className="mr-2" />
          Create New Snippet
        </Button>
        */}
      </div>

      {/* Table Layout Container */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_8px_32px_rgba(84,77,227,0.08)]">
        {/* Suspense for the table content */}
        <Suspense fallback={<SnippetsListSkeleton />}>
          {/* The Fetcher will need to render the table structure */}
          <SnippetsListFetcher />
        </Suspense>
      </div>
    </>
  )
}
