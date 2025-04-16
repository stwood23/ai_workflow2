"use client"

/**
 * @description
 * Renders the "Create Context Snippet" button and handles opening the modal
 * for creating a new snippet.
 *
 * @dependencies
 * - react: For useState hook.
 * - @/components/ui/button: Shadcn Button component.
 * - lucide-react: For the PlusCircle icon.
 * - @/lib/utils: For cn utility (though not explicitly used here after edit).
 * - ./create-edit-snippet-modal: The modal component itself.
 *
 * @notes
 * - Manages the open/close state of the creation modal.
 * - Passes null as initialData to the modal, indicating "create" mode.
 */

import * as React from "react" // Import React namespace
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import CreateEditSnippetModal from "./create-edit-snippet-modal" // Import the modal

export default function CreateSnippetButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <Button onClick={handleOpenModal}>
        <PlusCircle className="mr-2 size-4" />
        Create Context Snippet
      </Button>

      {/* Render the modal */}
      <CreateEditSnippetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={null} // Explicitly set to null for create mode
      />
    </>
  )
}
