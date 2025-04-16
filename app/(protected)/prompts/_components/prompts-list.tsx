/**
 * @description
 * This server component displays a list of prompt templates provided to it.
 * It renders the prompts using Shadcn Card components in a responsive grid layout.
 * Handles the empty state when no prompts are available.
 *
 * Key features:
 * - Renders a list of prompts using Card components.
 * - Displays prompt title, default LLM provider, and timestamp.
 * - Includes placeholder action buttons (Generate Document, Edit, Delete) with icons.
 * - Shows a user-friendly message when the prompt list is empty.
 *
 * @dependencies
 * - @/db/schema (for SelectPromptTemplate type)
 * - @/components/ui/card
 * - @/components/ui/button
 * - lucide-react (for icons: FileText, Pencil, Trash2)
 *
 * @notes
 * - The action buttons (Generate, Edit, Delete) are currently placeholders
 *   and do not have functionality implemented yet.
 * - Assumes `SelectPromptTemplate` includes `id`, `title`, `defaultLlmProvider`,
 *   `createdAt`, and `updatedAt` fields.
 * - Timestamp formatting can be improved later (e.g., using date-fns).
 * - Marked async to comply with Next.js requirements for default exported server components.
 */
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { SelectPromptTemplate } from "@/db/schema"
import { deletePromptTemplateAction } from "@/actions/db/prompts-actions"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Pencil, Trash2, Copy } from "lucide-react"
import DeletePromptConfirmModal from "./delete-prompt-confirm-modal"
import CreatePromptModal from "./create-prompt-modal"

interface PromptsListProps {
  initialPrompts: SelectPromptTemplate[]
}

export default function PromptsList({ initialPrompts }: PromptsListProps) {
  const [isDeleting, startDeleteTransition] = useTransition()
  const router = useRouter()
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null)

  const handleDeleteClick = (promptId: string) => {
    setPromptToDelete(promptId)
    setIsConfirmModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!promptToDelete) return

    startDeleteTransition(async () => {
      try {
        const result = await deletePromptTemplateAction(promptToDelete)
        if (result.isSuccess) {
          toast.success(result.message)
          router.refresh()
          setIsConfirmModalOpen(false)
          setPromptToDelete(null)
        } else {
          toast.error(result.message || "Failed to delete prompt.")
        }
      } catch (error) {
        console.error("Error deleting prompt:", error)
        toast.error("An unexpected error occurred while deleting.")
        setIsConfirmModalOpen(false)
        setPromptToDelete(null)
      }
    })
  }

  const handleCopy = (promptId: string) => {
    console.log("Copy prompt clicked:", promptId)
    toast.info("Copy functionality not yet implemented.")
  }

  if (!initialPrompts || initialPrompts.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <div className="bg-secondary mb-4 flex size-20 items-center justify-center rounded-full">
          <FileText className="text-secondary-foreground size-10" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">No Prompts Yet</h3>
        <p className="text-muted-foreground-darker">
          Get started by creating your first prompt template.
        </p>
      </div>
    )
  }

  return (
    <>
      <tbody className="divide-y divide-[#F0F0F7]">
        {initialPrompts.map(prompt => (
          <tr
            key={prompt.id}
            className="group transition-colors hover:bg-[#F7F8FC]"
          >
            <td className="px-6 py-5">
              <div className="text-lg font-semibold text-[#23203A]">
                {prompt.title}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="text-base font-medium text-[#2AB090]">
                {prompt.modelId}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="text-muted-foreground-darker text-base">
                {new Date(prompt.updatedAt).toLocaleDateString()}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="flex gap-3">
                <button
                  onClick={() => handleCopy(prompt.id)}
                  className="text-muted-foreground-darker p-2.5 transition-all hover:bg-[#E6F7F0] hover:text-[#2AB090]"
                  aria-label="Copy Prompt"
                >
                  <Copy size={18} />
                </button>
                <CreatePromptModal initialData={prompt} isEditMode={true}>
                  <button
                    className="text-muted-foreground-darker p-2.5 transition-all hover:bg-[#E6F7F0] hover:text-[#2AB090]"
                    aria-label="Edit Prompt"
                  >
                    <Pencil size={18} />
                  </button>
                </CreatePromptModal>
                <button
                  onClick={() => handleDeleteClick(prompt.id)}
                  disabled={isDeleting && promptToDelete === prompt.id}
                  className="text-muted-foreground-darker p-2.5 transition-all hover:bg-[#ECECFC] hover:text-[#F67884] disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Delete Prompt"
                >
                  {isDeleting && promptToDelete === prompt.id ? (
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

      <DeletePromptConfirmModal
        isOpen={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  )
}
