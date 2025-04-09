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
 * - ./_components/create-prompt-button (CreatePromptButton)
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

import { getPromptTemplatesAction } from "@/actions/db/prompts-actions"
import PromptsList from "./_components/prompts-list"
import PromptsListSkeleton from "./_components/prompts-list-skeleton"
import CreatePromptButton from "./_components/create-prompt-button"
import PageHeader from "@/components/utilities/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

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

  return <PromptsList initialPrompts={result.data} />
}

// Make the component async to correctly await auth()
export default async function PromptsPage() {
  const { userId } = await auth()

  // Ensure user is authenticated
  if (!userId) {
    // In a real application, you might redirect or show a more specific auth error
    // For now, returning null or a simple message suffices.
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            Please sign in to view your prompts.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Prompt Templates" />
        <CreatePromptButton />
      </div>

      <Suspense fallback={<PromptsListSkeleton />}>
        <PromptsListFetcher /> {/* No userId prop needed */}
      </Suspense>
    </div>
  )
}
