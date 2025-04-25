"use server"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

/**
 * @description
 * Renders a generic skeleton loading state for tables.
 * Displays a table structure with placeholder rows and cells using Shadcn's Skeleton component.
 *
 * @dependencies
 * - @/components/ui/skeleton: Shadcn Skeleton component.
 * - @/components/ui/table: Shadcn Table components.
 *
 * @props
 * - `numRows?`: Number of skeleton rows to display (default: 5).
 * - `numCols?`: Number of skeleton columns to display (default: 5).
 * - `includeHeader?`: Whether to include the skeleton table header (default: true).
 * - `className?`: Optional additional CSS classes for the container div.
 * - `headerWidths?`: Optional array of Tailwind width classes for table headers (e.g., ['w-[200px]', 'w-auto', 'w-[150px]']). Length must match `numCols` if provided.
 *
 * @notes
 * - Can be used as a fallback for Suspense boundaries wrapping tables.
 */
interface TableSkeletonProps {
  numRows?: number
  numCols?: number
  includeHeader?: boolean
  className?: string
  headerWidths?: string[]
}

export default async function TableSkeleton({
  numRows = 5,
  numCols = 5,
  includeHeader = true,
  className,
  headerWidths
}: TableSkeletonProps) {
  if (headerWidths && headerWidths.length !== numCols) {
    console.warn(
      "TableSkeleton: headerWidths length does not match numCols. Widths will not be applied."
    )
    headerWidths = undefined // Reset if lengths don't match
  }

  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        {includeHeader && (
          <TableHeader>
            <TableRow>
              {[...Array(numCols)].map((_, i) => (
                <TableHead key={i} className={headerWidths?.[i]}>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {[...Array(numRows)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(numCols)].map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
