"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Pencil } from "lucide-react" // Removed ArrowLeft, Sparkles
import { usePostHog } from "posthog-js/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
  // Removed DialogTrigger - controlled externally
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
// Removed Label (no longer used directly)
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
// Removed optimizePromptAction, generateTitleAction
import {
  createPromptTemplateAction,
  updatePromptTemplateAction
} from "@/actions/db/prompts-actions"
import { cn } from "@/lib/utils"
import { SelectPromptTemplate } from "@/db/schema"

// Define the available models (keep this definition accessible)
const availableModels = [
  { id: "gpt-4o", name: "OpenAI - GPT-4o" },
  { id: "gpt-4o-mini", name: "OpenAI - GPT-4o Mini" },
  { id: "gpt-4-turbo", name: "OpenAI - GPT-4 Turbo" },
  { id: "claude-3-5-sonnet-20240620", name: "Anthropic - Claude 3.5 Sonnet" },
  { id: "claude-3-opus-20240229", name: "Anthropic - Claude 3 Opus" },
  { id: "grok-1.5", name: "xAI - Grok 1.5" }
] as const

const modelIds = availableModels.map(m => m.id)

// Define the form schema - rawPrompt is needed for create, optional otherwise
const formSchema = z.object({
  rawPrompt: z.string().optional(), // Needed for create action, not shown in UI here
  optimizedPrompt: z.string().min(10, {
    message: "Optimized prompt must be at least 10 characters."
  }),
  title: z.string().min(3, {
    message: "Title must be at least 3 characters."
  }),
  modelId: z
    .string()
    .refine(val => modelIds.includes(val as (typeof modelIds)[number]), {
      message: "Invalid model selected."
    })
})

export type CreatePromptFormValues = z.infer<typeof formSchema>

// Define the structure for initialData when creating (passed from input modal)
export interface InitialOptimizationData {
  rawPrompt: string
  optimizedPrompt: string
  title: string
  modelId?: string // Can optionally pass a default from input step if needed
}

// Define props for the refine/edit modal
interface CreatePromptRefineModalProps {
  initialData: SelectPromptTemplate | InitialOptimizationData // Can be full DB record or optimized data
  isEditMode: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreatePromptRefineModal({
  initialData,
  isEditMode,
  isOpen,
  onOpenChange
}: CreatePromptRefineModalProps) {
  // No longer needs internal isOpen state or step state
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isSaving, startSaveTransition] = useTransition()
  const router = useRouter()
  const posthog = usePostHog()

  const form = useForm<CreatePromptFormValues>({
    resolver: zodResolver(formSchema),
    // Default values are now set in useEffect based on initialData
    defaultValues: {
      rawPrompt: "", // Initialize, will be set in useEffect
      optimizedPrompt: "",
      title: "",
      modelId: availableModels[0].id // Default, will be overridden
    }
  })

  // Effect to reset form when initialData changes or modal opens
  useEffect(() => {
    if (isOpen && initialData) {
      // Check if initialData is SelectPromptTemplate (has 'id') or InitialOptimizationData
      if ("id" in initialData) {
        // Edit mode with full DB record
        form.reset({
          rawPrompt: initialData.rawPrompt ?? undefined, // Keep raw prompt if exists
          optimizedPrompt: initialData.optimizedPrompt,
          title: initialData.title,
          modelId: initialData.modelId
        })
      } else {
        // Create mode refinement step with optimized data
        form.reset({
          rawPrompt: initialData.rawPrompt, // Set raw prompt from input step
          optimizedPrompt: initialData.optimizedPrompt,
          title: initialData.title,
          // Use passed modelId or default if not provided
          modelId: initialData.modelId || availableModels[0].id
        })
      }
      setIsEditingTitle(false) // Reset title edit state on open/data change
    } else if (!isOpen) {
      // Optionally reset form when closing if desired, though maybe not necessary
      // as parent controls opening with fresh data? Let's reset for safety.
      form.reset({
        rawPrompt: "",
        optimizedPrompt: "",
        title: "",
        modelId: availableModels[0].id
      })
      setIsEditingTitle(false)
    }
  }, [initialData, isOpen, isEditMode, form]) // Added isOpen dependency

  // onSubmit remains largely the same, but create path uses values directly
  const onSubmit = (values: CreatePromptFormValues) => {
    startSaveTransition(async () => {
      try {
        let result
        if (isEditMode && initialData && "id" in initialData) {
          // Update existing prompt (ensure initialData has 'id')
          result = await updatePromptTemplateAction(initialData.id, {
            title: values.title,
            optimizedPrompt: values.optimizedPrompt,
            modelId: values.modelId
            // rawPrompt is not updated in edit mode
          })
          if (result.isSuccess) {
            toast.success(result.message || "Prompt updated successfully!")
            onOpenChange(false) // Close modal on success using callback
            router.refresh()
          } else {
            toast.error(result.message || "Failed to update prompt.")
          }
        } else {
          // Create new prompt (using form values including rawPrompt)
          result = await createPromptTemplateAction({
            rawPrompt: values.rawPrompt ?? "", // Ensure rawPrompt is included
            optimizedPrompt: values.optimizedPrompt,
            title: values.title,
            modelId: values.modelId
          })

          if (result.isSuccess) {
            toast.success(result.message || "Prompt created successfully!")
            posthog?.capture("prompt_template_created", {
              promptId: result.data.id
            })
            onOpenChange(false) // Close modal on success using callback
            router.refresh()
          } else {
            toast.error(result.message || "Failed to create prompt.")
          }
        }
      } catch (error) {
        console.error(
          `Error ${isEditMode ? "updating" : "saving"} prompt template:`,
          error
        )
        toast.error(
          `An unexpected error occurred while ${isEditMode ? "updating" : "saving"}.`
        )
      }
    })
  }

  // handleOpenChange is now passed from parent
  const handleInternalOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditingTitle(false) // Reset edit state on close via X or overlay
    }
    onOpenChange(open) // Call parent handler
  }

  return (
    // Use the passed isOpen and onOpenChange
    <Dialog open={isOpen} onOpenChange={handleInternalOpenChange}>
      {/* No DialogTrigger here */}
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          {/* Simplified title */}
          <DialogTitle>
            {isEditMode ? "Edit Prompt Template" : "Refine Prompt Template"}
          </DialogTitle>
          {/* Removed description, can be added if needed */}
          {/* <DialogDescription>...</DialogDescription> */}
        </DialogHeader>

        <Form {...form}>
          {/* Form submission uses the component's onSubmit */}
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
            {/* Content is always the "refine" step layout */}
            <>
              {/* ----- Click-to-edit Title ----- */}
              <FormItem className="space-y-1">
                {isEditingTitle ? (
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormControl>
                        <Input
                          placeholder="A descriptive title..."
                          {...field}
                          onBlur={() => setIsEditingTitle(false)}
                          autoFocus
                          className="text-lg font-semibold"
                        />
                      </FormControl>
                    )}
                  />
                ) : (
                  <div
                    className="hover:border-input flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-2"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <h3 className="text-lg font-semibold leading-none tracking-tight">
                      {form.watch("title") || "Click to add title"}
                    </h3>
                    <Pencil className="text-muted-foreground size-4" />
                  </div>
                )}
                <FormMessage>
                  {form.formState.errors.title?.message}
                </FormMessage>
              </FormItem>

              {/* ----- Model Selection ----- */}
              <FormField
                control={form.control}
                name="modelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormDescription className="!mt-0 mb-2">
                      Select the specific model for this template.
                    </FormDescription>
                    <Select
                      onValueChange={field.onChange}
                      // Use form state value which is updated by useEffect
                      value={field.value}
                      disabled={isSaving}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableModels.map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ----- Optimized Prompt ----- */}
              <FormField
                control={form.control}
                name="optimizedPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optimized Prompt</FormLabel>
                    <FormDescription className="!mt-0 mb-2">
                      Review and edit the refined prompt if needed.
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="The AI-optimized prompt will appear here..."
                        rows={12}
                        {...field}
                        // isOptimizing state removed
                        // className={cn(isOptimizing && "text-muted-foreground italic")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>

            {/* Footer buttons */}
            <DialogFooter className="pt-4">
              <>
                {/* No Back button needed as it's a separate modal */}
                {/* Cancel Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleInternalOpenChange(false) // Close modal via callback
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>

                {/* Submit Button */}
                <Button type="submit" disabled={isSaving || isEditingTitle}>
                  {isSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {isSaving
                    ? isEditMode
                      ? "Saving Changes..."
                      : "Saving..."
                    : isEditMode
                      ? "Save Changes"
                      : "Save Prompt"}
                </Button>
              </>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
