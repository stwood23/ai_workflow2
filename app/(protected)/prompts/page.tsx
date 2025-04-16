/**
 * @description
 * This server component serves as the main page for the /prompts route.
 * It handles user authentication, fetches the list of prompt templates
 * using a server action, and displays them using the PromptsList component.
 * It utilizes Suspense to show a loading state (PromptsListSkeleton)
 * while the data is being fetched.
 *
 * Key features:
 * - Authenticates the user using Clerk.
 * - Fetches prompt templates via getPromptTemplatesAction.
 * - Uses React Suspense for asynchronous data loading with a skeleton fallback.
 * - Renders the page header, a modal trigger to create new prompts, and the list of prompts.
 * - Handles potential errors during data fetching.
 *
 * @dependencies
 * - react (Suspense)
 * - @clerk/nextjs/server (auth)
 * - @/actions/db/prompts-actions (getPromptTemplatesAction)
 * - ./_components/prompts-list (PromptsList)
 * - ./_components/prompts-list-skeleton (PromptsListSkeleton)
 * - ./_components/create-prompt-input-modal (CreatePromptInputModal)
 * - @/components/utilities/page-header (PageHeader)
 * - @/components/ui/alert (Alert, AlertDescription, AlertTitle - for errors)
 * - lucide-react (AlertTriangle - for errors)
 *
 * @notes
 * - The PromptsListFetcher internal component encapsulates the data fetching logic
 *   to work seamlessly with Suspense.
 * - Assumes getPromptTemplatesAction retrieves userId internally via auth().
 */
"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { PlusCircle, AlertTriangle } from "lucide-react"

import { getPromptTemplatesAction } from "@/actions/db/prompts-actions"
import PromptsList from "./_components/prompts-list"
import PromptsListSkeleton from "./_components/prompts-list-skeleton"
import CreatePromptInputModal from "./_components/create-prompt-input-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

// Internal component to fetch data, allowing the main page component
// to remain synchronous for Suspense integration.
// This component assumes getPromptTemplatesAction will get the userId internally.
async function PromptsListFetcher() {
  const result = await getPromptTemplatesAction()

  if (!result.isSuccess) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="size-4" />
        <AlertTitle>Error Loading Prompts</AlertTitle>
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    )
  }

  // Render the table structure inside the fetcher when data is ready
  return (
    <div className="overflow-hidden rounded-2xl">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#F0F0F7] text-left">
            <th className="text-muted-foreground-darker px-6 py-5 text-lg font-medium">
              Template Name
            </th>
            <th className="text-muted-foreground-darker px-6 py-5 text-lg font-medium">
              Model
            </th>
            <th className="text-muted-foreground-darker px-6 py-5 text-lg font-medium">
              Last Updated
            </th>
            <th className="text-muted-foreground-darker px-6 py-5 text-left text-lg font-medium">
              Actions
            </th>
          </tr>
        </thead>
        {/* Pass data to PromptsList to render table body */}
        <PromptsList initialPrompts={result.data} />
      </table>
    </div>
  )
}

// Make the component async to correctly await auth()
export default async function PromptsPage() {
  const { userId } = await auth()

  // Ensure user is authenticated
  if (!userId) {
    // Return only the Alert part, layout is handled by layout.tsx
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          Please sign in to view your prompts.
        </AlertDescription>
      </Alert>
    )
  }

  // Return content directly, no outer layout div needed
  return (
    <>
      {/* Header Section */}
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-[#23203A]">Prompt Templates</h1>

        {/* Wrap trigger in the Input Modal */}
        <CreatePromptInputModal>
          <Button className="bg-gradient-to-r from-[#22965A] to-[#2AB090] px-8 py-6 text-base font-bold shadow-[0_4px_16px_rgba(34,150,90,0.16)] hover:shadow-[0_8px_32px_rgba(34,150,90,0.24)]">
            <PlusCircle size={20} className="mr-2" />
            Create New Prompt
          </Button>
        </CreatePromptInputModal>
      </div>

      {/* Table Layout Container */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_8px_32px_rgba(84,77,227,0.08)]">
        {/* Suspense for the table content */}
        <Suspense fallback={<PromptsListSkeleton />}>
          <PromptsListFetcher /> {/* Renders table structure */}
        </Suspense>
      </div>
    </>
  )
}
