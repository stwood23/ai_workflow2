"use server"

import { SelectContextSnippet } from "@/db/schema"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

/**
 * @description
 * Renders the list of context snippets in a DataTable.
 * Displays snippet name, content preview, creation/update timestamps, and action buttons.
 *
 * @param {Object} props - Component props.
 * @param {SelectContextSnippet[]} props.snippets - Array of context snippet data.
 *
 * @dependencies
 * - @/db/schema: SelectContextSnippet type.
 * - @/components/ui/table: Shadcn Table components.
 * - @/components/ui/badge: Shadcn Badge component.
 * - @/components/ui/button: Shadcn Button component.
 * - @/components/ui/dropdown-menu: Shadcn DropdownMenu components.
 * - lucide-react: For the MoreHorizontal icon.
 *
 * @notes
 * - Assumes the underlying DataTable structure/styling is handled by Shadcn components.
 * - Action handlers (Edit/Delete) are placeholders and will be implemented in Step 3.3.
 * - Content preview is truncated for display purposes.
 */

interface SnippetsListProps {
  snippets: SelectContextSnippet[]
}

export default async function SnippetsList({ snippets }: SnippetsListProps) {
  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) {
      return content
    }
    return content.substring(0, maxLength) + "..."
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Content Preview</TableHead>
            <TableHead className="w-[150px]">Created At</TableHead>
            <TableHead className="w-[150px]">Updated At</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {snippets.length > 0 ? (
            snippets.map(snippet => (
              <TableRow key={snippet.id}>
                <TableCell>
                  <Badge variant="outline">{snippet.name}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {truncateContent(snippet.content)}
                </TableCell>
                <TableCell>{formatDate(snippet.createdAt)}</TableCell>
                <TableCell>{formatDate(snippet.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="size-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          alert(`Edit action for ${snippet.name} coming soon!`)
                        }
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          alert(
                            `Delete action for ${snippet.name} coming soon!`
                          )
                        }
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No context snippets found. Create one to get started!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
