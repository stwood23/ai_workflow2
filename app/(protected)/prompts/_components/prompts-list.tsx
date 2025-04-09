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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Pencil, Trash2 } from "lucide-react"
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

  const handleGenerate = (promptId: string) => {
    console.log("Generate document clicked:", promptId)
    toast.info("Generate document functionality not yet implemented.")
  }

  if (!initialPrompts || initialPrompts.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <div className="bg-secondary mb-4 flex size-20 items-center justify-center rounded-full">
          <FileText className="text-secondary-foreground size-10" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">No Prompts Yet</h3>
        <p className="text-muted-foreground">
          Get started by creating your first prompt template.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialPrompts.map(prompt => (
          <Card key={prompt.id}>
            <CardHeader>
              <CardTitle className="truncate">{prompt.title}</CardTitle>
              <CardDescription>
                LLM: {prompt.defaultLlmProvider}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {/* Placeholder for preview */}
              </p>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Updated: {new Date(prompt.updatedAt).toLocaleDateString()}
              </span>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Generate Document"
                  onClick={() => handleGenerate(prompt.id)}
                >
                  <FileText className="size-4" />
                </Button>
                <CreatePromptModal initialData={prompt} isEditMode={true}>
                  <Button variant="ghost" size="icon" aria-label="Edit Prompt">
                    <Pencil className="size-4" />
                  </Button>
                </CreatePromptModal>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  aria-label="Delete Prompt"
                  onClick={() => handleDeleteClick(prompt.id)}
                  disabled={isDeleting && promptToDelete === prompt.id}
                >
                  {isDeleting && promptToDelete === prompt.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <DeletePromptConfirmModal
        isOpen={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  )
}
