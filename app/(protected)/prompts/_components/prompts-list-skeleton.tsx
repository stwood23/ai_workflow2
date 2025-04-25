/**
 * @description
 * Renders a skeleton loading state for the PromptsList using the shared TableSkeleton.
 *
 * @dependencies
 * - @/components/ui/table-skeleton: The shared table skeleton component.
 *
 * @notes
 * - Replace props like numCols, numRows, and headerWidths as needed
 *   to match the final structure of the PromptsList table.
 * - Marked async to comply with Next.js requirements for default exported server components.
 */
"use server"

import TableSkeleton from "@/components/ui/table-skeleton"

export default async function PromptsListSkeleton() {
  // TODO: Adjust numCols, numRows, and headerWidths based on the actual PromptsList table structure.
  const numCols = 5 // Example: Adjust as needed
  const numRows = 6 // Example: Adjust as needed
  const headerWidths = ["w-[250px]", "w-[150px]", "", "w-[150px]", "w-[100px]"] // Example: Adjust as needed

  return (
    <TableSkeleton
      numCols={numCols}
      numRows={numRows}
      headerWidths={headerWidths}
    />
  )
}
