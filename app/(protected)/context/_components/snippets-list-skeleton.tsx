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
 * Renders a skeleton loading state for the context snippets list.
 * Mimics the structure of the DataTable used in `SnippetsList`.
 *
 * @dependencies
 * - @/components/ui/skeleton: Shadcn Skeleton component.
 * - @/components/ui/table: Shadcn Table components.
 *
 * @notes
 * - Used as the fallback for the Suspense boundary in the main context page.
 */
export default async function SnippetsListSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              <Skeleton className="h-4 w-full" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-full" />
            </TableHead>
            <TableHead className="w-[150px]">
              <Skeleton className="h-4 w-full" />
            </TableHead>
            <TableHead className="w-[150px]">
              <Skeleton className="h-4 w-full" />
            </TableHead>
            <TableHead className="w-[100px]">
              <Skeleton className="h-4 w-full" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
