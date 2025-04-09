/**
 * @description
 * This server component renders a skeleton loading state for the PromptsList.
 * It displays a grid of placeholder cards using Shadcn's Skeleton component,
 * mimicking the layout of the actual prompts list.
 *
 * Key features:
 * - Provides a visual placeholder during data fetching.
 * - Uses Shadcn Skeleton components for consistency.
 * - Mimics the grid layout of the PromptsList component.
 *
 * @dependencies
 * - @/components/ui/card
 * - @/components/ui/skeleton
 *
 * @notes
 * - The number of skeleton cards (e.g., 6) should roughly match the
 *   typical number of items displayed per page or initial load in PromptsList.
 * - Marked async to comply with Next.js requirements for default exported server components.
 */
"use server"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Needs to be async even if no await is used inside
export default async function PromptsListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-3/4" />
            </CardTitle>
            <Skeleton className="h-4 w-1/4" />{" "}
            {/* Placeholder for LLM provider */}
          </CardHeader>
          <CardContent>
            {/* Optionally add skeleton lines for prompt preview */}
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-4 w-1/3" /> {/* Placeholder for timestamp */}
            <div className="flex space-x-2">
              <Skeleton className="size-8 rounded-full" />{" "}
              {/* Action buttons */}
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="size-8 rounded-full" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
