"use client"

/**
 * @description
 * This component provides a modal dialog for creating or editing context snippets.
 * It uses react-hook-form for form management and validation, and interacts
 * with server actions to persist changes.
 *
 * Key features:
 * - Handles both "Create" and "Edit" modes based on initialData prop.
 * - Validates snippet name format (@\\w+) and content presence.
 * - Shows loading states during form submission.
 * - Displays success/error toasts based on server action response.
 * - Refreshes page data on successful save.
 * - Tracks snippet creation events using PostHog.
 *
 * @dependencies
 * - react: Core React hooks (useState, useEffect, useTransition)
 * - next/navigation: useRouter for page refresh
 * - react-hook-form: Form state management and validation
 * - zod: Schema validation
 * - @hookform/resolvers/zod: Zod resolver for react-hook-form
 * - sonner: Toast notifications
 * - posthog-js: Analytics tracking
 * - @\\/components/ui/*: Shadcn UI components (Dialog, Form, Input, Textarea, Button)
 * - @\\/actions/db/context-snippets-actions: Server actions for CRUD operations
 * - @\\/db/schema: Type definitions (SelectContextSnippet)
 * - @\\/lib/utils: cn utility function
 *
 * @notes
 * - Assumes parent component manages modal open/close state and provides necessary props.
 * - Validation requires snippet name to start with '@' followed by word characters.
 */

import * as React from "react"
import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SelectContextSnippet } from "@/db/schema"
import {
  createContextSnippetAction,
  updateContextSnippetAction
} from "@/actions/db/context-snippets-actions"

// Updated Validation schema: Validates the part *after* the '@'
const snippetFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name cannot be empty." })
    .regex(/^[\w-]+$/, {
      message:
        "Name must contain only letters, numbers, underscores, or dashes."
    }),
  content: z.string().min(1, { message: "Content cannot be empty." })
})

type SnippetFormData = z.infer<typeof snippetFormSchema>

interface CreateEditSnippetModalProps {
  isOpen: boolean
  onClose: () => void
  initialData: SelectContextSnippet | null // Null for create, data for edit
}

export default function CreateEditSnippetModal({
  isOpen,
  onClose,
  initialData
}: CreateEditSnippetModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditMode = initialData !== null

  const form = useForm<SnippetFormData>({
    resolver: zodResolver(snippetFormSchema),
    defaultValues: {
      name: "",
      content: ""
    }
  })

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name.substring(1), // Remove leading '@' for form input
        content: initialData.content
      })
    } else {
      form.reset({
        name: "",
        content: ""
      })
    }
  }, [initialData, form])

  const onSubmit = (values: SnippetFormData) => {
    // Prepend '@' before sending to the server action
    const valuesToSend = {
      ...values,
      name: `@${values.name}`
    }

    startTransition(async () => {
      try {
        let result
        if (isEditMode && initialData) {
          // Pass the ID and the modified values (with '@')
          result = await updateContextSnippetAction(
            initialData.id,
            valuesToSend
          )
        } else {
          // Pass the modified values (with '@')
          result = await createContextSnippetAction(valuesToSend)

          // Track creation event ONLY on successful creation
          if (result.isSuccess) {
            posthog.capture("context_snippet_created", {
              // Optionally include snippet ID if available and serializable in result.data
              // snippetId: result.data?.id // Example, adjust based on actual ActionState data structure
            })
          }
        }

        if (result.isSuccess) {
          toast.success(result.message)
          onClose() // Close the modal
          router.refresh() // Refresh the page data
        } else {
          toast.error(result.message || "An unknown error occurred.")
        }
      } catch (error) {
        console.error("Failed to save snippet:", error)
        toast.error("Failed to save snippet. Please try again.")
      }
    })
  }

  // Handle closing the dialog and resetting form state if needed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      // Reset the form to default values when the modal is closed
      form.reset({ name: "", content: "" })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit" : "Create"} Context Snippet
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of your context snippet."
              : "Add a new context snippet. Start the name with '@'."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground">@</span>
                    <FormControl>
                      <Input
                        placeholder="company_info"
                        {...field}
                        disabled={isPending}
                        className="flex-1"
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Enter the name without the '@' symbol (e.g.,
                    product_details).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the snippet content here..."
                      className="min-h-[100px] resize-y"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Snippet"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
