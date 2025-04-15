"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SelectContextSnippet } from "@/db/schema"
import { deleteContextSnippetAction } from "@/actions/db/context-snippets-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Copy, Pencil, Trash2, Loader2 } from "lucide-react"

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
 * - @/components/ui/badge: Shadcn Badge component.
 * - @/components/ui/button: Shadcn Button component.
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

export default function SnippetsList({ snippets }: SnippetsListProps) {
  const [isDeleting, startDeleteTransition] = useTransition()
  const router = useRouter()
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [snippetToDelete, setSnippetToDelete] = useState<string | null>(null)

  const truncateContent = (content: string, maxLength = 50) => {
    if (content.length <= maxLength) {
      return content
    }
    return content.substring(0, maxLength) + "..."
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString()
  }

  const handleDeleteClick = (snippetId: string) => {
    setSnippetToDelete(snippetId)
    setIsConfirmModalOpen(true)
    alert("Delete confirmation modal placeholder.")
  }

  const handleConfirmDelete = () => {
    if (!snippetToDelete) return

    startDeleteTransition(async () => {
      try {
        const result = await deleteContextSnippetAction(snippetToDelete)
        if (result.isSuccess) {
          toast.success(result.message)
          router.refresh()
          setIsConfirmModalOpen(false)
          setSnippetToDelete(null)
        } else {
          toast.error(result.message || "Failed to delete snippet.")
        }
      } catch (error) {
        console.error("Error deleting snippet:", error)
        toast.error("An unexpected error occurred while deleting.")
        setIsConfirmModalOpen(false)
        setSnippetToDelete(null)
      }
    })
  }

  const handleCopy = (snippetId: string) => {
    console.log("Copy snippet clicked:", snippetId)
    toast.info("Copy snippet functionality not yet implemented.")
  }

  const handleEdit = (snippetId: string) => {
    console.log("Edit snippet clicked:", snippetId)
    toast.info("Edit snippet functionality not yet implemented.")
  }

  if (!snippets || snippets.length === 0) {
    return (
      <tbody className="divide-y divide-[#F0F0F7]">
        <tr className="hover:bg-[#F7F8FC]">
          <td
            colSpan={4}
            className="text-muted-foreground-darker px-6 py-10 text-center"
          >
            <div className="flex flex-col items-center">
              <FileText size={40} className="mb-3" />
              No context snippets found. Create one to get started!
            </div>
          </td>
        </tr>
      </tbody>
    )
  }

  return (
    <>
      <tbody className="divide-y divide-[#F0F0F7]">
        {snippets.map(snippet => (
          <tr
            key={snippet.id}
            className="group transition-colors hover:bg-[#F7F8FC]"
          >
            <td className="px-6 py-5">
              <div className="text-lg font-semibold text-[#23203A]">
                {snippet.name}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="text-muted-foreground-darker text-base">
                {truncateContent(snippet.content)}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="text-muted-foreground-darker text-base">
                {formatDate(snippet.updatedAt)}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="flex gap-3">
                <button
                  onClick={() => handleCopy(snippet.id)}
                  className="text-muted-foreground-darker p-2.5 transition-all hover:bg-[#E6F7F0] hover:text-[#2AB090]"
                  aria-label="Copy Snippet"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={() => handleEdit(snippet.id)}
                  className="text-muted-foreground-darker p-2.5 transition-all hover:bg-[#E6F7F0] hover:text-[#2AB090]"
                  aria-label="Edit Snippet"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDeleteClick(snippet.id)}
                  disabled={isDeleting && snippetToDelete === snippet.id}
                  className="text-muted-foreground-darker p-2.5 transition-all hover:bg-[#ECECFC] hover:text-[#F67884] disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Delete Snippet"
                >
                  {isDeleting && snippetToDelete === snippet.id ? (
                    <Loader2 className="size-[18px] animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </>
  )
}
