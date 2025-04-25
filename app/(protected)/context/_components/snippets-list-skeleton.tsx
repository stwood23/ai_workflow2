"use server"

import TableSkeleton from "@/components/ui/table-skeleton"

/**
 * @description
 * Renders a skeleton loading state for the context snippets list
 * using the shared TableSkeleton component.
 *
 * @dependencies
 * - @/components/ui/table-skeleton: The shared table skeleton component.
 *
 * @notes
 * - Passes specific header widths appropriate for the snippets table.
 */
export default async function SnippetsListSkeleton() {
  const headerWidths = ["w-[200px]", "", "w-[150px]", "w-[150px]", "w-[100px]"]
  return <TableSkeleton numCols={5} numRows={5} headerWidths={headerWidths} />
}
