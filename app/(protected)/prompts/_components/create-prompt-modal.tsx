/**
 * @description
 * This client component provides a modal dialog for creating OR editing and optimizing AI prompt templates.
 * In create mode, users input a raw prompt, trigger LLM optimization and title generation,
 * select a default LLM provider, edit the results, and save the new prompt template.
 * In edit mode, users can refine an existing prompt's optimized text and title, change the
 * default LLM provider, and save the updates. The raw prompt input and optimization step are skipped in edit mode.
 *
 * Key features:
 * - Supports both creating new prompts and editing existing ones.
 * - Form handling with validation using react-hook-form and zod.
 * - Integration with server actions for LLM optimization, title generation, saving, and updating prompts.
 * - Displays loading states during asynchronous operations.
 * - Provides user feedback via toasts (sonner).
 * - Refreshes the prompt list upon successful creation/update using router.refresh().
 * - PostHog analytics tracking for prompt creation and optimization.
 *
 * @dependencies
 * - react: for component state and hooks (useState, useEffect, useTransition).
 * - react-hook-form: for managing form state and validation.
 * - zod: for defining the form validation schema.
 * - sonner: for displaying toast notifications.
 * - @radix-ui/react-dialog: Underlying component for Shadcn Dialog.
 * - lucide-react: for icons.
 * - next/navigation: for router access (useRouter).
 * - posthog-js/react: for analytics tracking (usePostHog).
 * - Shadcn UI components: Dialog, Button, Input, Textarea, Label, Form, Select.
 * - Server Actions: optimizePromptAction, generateTitleAction, createPromptTemplateAction, updatePromptTemplateAction.
 * - Types: ActionState, LlmProviderEnum, SelectPromptTemplate.
 * - Utilities: cn.
 *
 * @props
 * - initialData?: SelectPromptTemplate - Optional data for pre-filling the form in edit mode.
 * - isEditMode?: boolean - Flag to indicate if the modal is in edit mode. Defaults to false.
 * - children: React.ReactNode - The element that triggers the modal opening (e.g., a Button).
 *
 * @notes
 * - Assumes the existence and correct implementation of the imported server actions.
 * - Assumes necessary Shadcn components and libraries are installed.
 * - Assumes PostHogProvider is correctly set up in a parent layout.
 * - Uses `router.refresh()` for simplicity in updating the parent list.
 * - Error handling relies on the `ActionState` pattern from server actions.
 * - The raw prompt field is not used or shown in edit mode.
 */
"use client"

import { useState, useEffect, useTransition, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import { usePostHog } from "posthog-js/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  optimizePromptAction,
  generateTitleAction
} from "@/actions/llm-actions"
import {
  createPromptTemplateAction,
  updatePromptTemplateAction
} from "@/actions/db/prompts-actions"
import { cn } from "@/lib/utils"
import { SelectPromptTemplate } from "@/db/schema"

// Define the available models
const availableModels = [
  { id: "gpt-4o", name: "OpenAI - GPT-4o" },
  { id: "gpt-4o-mini", name: "OpenAI - GPT-4o Mini" },
  { id: "gpt-4-turbo", name: "OpenAI - GPT-4 Turbo" },
  { id: "claude-3-5-sonnet-20240620", name: "Anthropic - Claude 3.5 Sonnet" },
  { id: "claude-3-opus-20240229", name: "Anthropic - Claude 3 Opus" },
  { id: "grok-1.5", name: "xAI - Grok 1.5" }
] as const // Use 'as const' for stricter typing of IDs

// Extract model IDs for Zod validation
const modelIds = availableModels.map(m => m.id)

// Define the form schema using Zod
// Raw prompt is optional in edit mode, but always present in create mode flow
const formSchema = z.object({
  rawPrompt: z.string().optional(), // Keep optional for form structure, but logic handles its use
  optimizedPrompt: z.string().min(10, {
    message: "Optimized prompt must be at least 10 characters."
  }),
  title: z.string().min(3, {
    message: "Title must be at least 3 characters."
  }),
  // Change from enum to string validation against model IDs
  modelId: z
    .string()
    .refine(val => modelIds.includes(val as (typeof modelIds)[number]), {
      message: "Invalid model selected."
    })
  // defaultLlmProvider: z.enum(llmProviderEnum.enumValues) // Remove old provider validation
})

export type CreatePromptFormValues = z.infer<typeof formSchema>

type ModalStep = "input" | "refine"

interface CreatePromptModalProps {
  initialData?: SelectPromptTemplate
  isEditMode?: boolean
  children: ReactNode // Expect a trigger element
}

export default function CreatePromptModal({
  initialData,
  isEditMode = false,
  children
}: CreatePromptModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Start directly in refine step if in edit mode
  const [step, setStep] = useState<ModalStep>(isEditMode ? "refine" : "input")
  const [isOptimizing, startOptimizeTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()
  const router = useRouter()
  const posthog = usePostHog()

  const form = useForm<CreatePromptFormValues>({
    resolver: zodResolver(formSchema),
    // Initialize values based on mode and initialData
    defaultValues: {
      rawPrompt: initialData?.rawPrompt || "", // Use initial raw prompt if available (though not directly used in edit mode UI)
      optimizedPrompt: initialData?.optimizedPrompt || "",
      title: initialData?.title || "",
      // Update to use modelId and a default model ID
      modelId: initialData?.modelId || availableModels[0].id // Default to the first model
      // defaultLlmProvider: initialData?.defaultLlmProvider || "openai" // Remove old provider default
    }
  })

  // Effect to reset form and step when initialData changes (e.g., opening edit for a different prompt)
  // or when switching between create/edit implicitly if the component instance persisted (unlikely but safe)
  useEffect(() => {
    if (isEditMode && initialData) {
      form.reset({
        rawPrompt: initialData.rawPrompt ?? undefined, // Use undefined as default
        optimizedPrompt: initialData.optimizedPrompt,
        title: initialData.title,
        modelId: initialData.modelId
      })
      setStep("refine")
    } else {
      form.reset({
        rawPrompt: "",
        optimizedPrompt: "",
        title: "",
        modelId: availableModels[0].id
      })
      setStep("input")
    }
  }, [initialData, isEditMode, form])

  const handleOptimize = () => {
    // Trigger validation only for rawPrompt before optimizing
    form.trigger("rawPrompt").then(isValid => {
      if (!isValid) {
        toast.warning("Please enter a valid raw prompt (min 10 chars).")
        return
      }

      const rawPromptValue = form.getValues("rawPrompt")

      // Type check to ensure rawPromptValue is a string
      if (typeof rawPromptValue !== "string" || rawPromptValue.trim() === "") {
        toast.error("Raw prompt is missing or invalid. Cannot optimize.")
        return
      }

      // Now rawPromptValue is guaranteed to be a non-empty string
      startOptimizeTransition(async () => {
        form.setValue("optimizedPrompt", "Optimizing...")
        form.setValue("title", "Generating title...")
        toast.info("Optimizing prompt and generating title...")

        try {
          const [optimizeResult, titleResult] = await Promise.allSettled([
            optimizePromptAction(rawPromptValue),
            generateTitleAction(rawPromptValue)
          ])

          let optimizedSuccess = false
          let titleSuccess = false

          // Handle Optimization Result
          if (
            optimizeResult.status === "fulfilled" &&
            optimizeResult.value.isSuccess
          ) {
            form.setValue("optimizedPrompt", optimizeResult.value.data)
            form.clearErrors("optimizedPrompt")
            optimizedSuccess = true
            posthog?.capture("prompt_template_optimized")
          } else {
            const errorMessage =
              optimizeResult.status === "fulfilled"
                ? optimizeResult.value.message
                : "Optimization failed unexpectedly."
            form.setError("optimizedPrompt", {
              type: "manual",
              message: errorMessage
            })
            // rawPromptValue is guaranteed to be a string here due to the earlier check
            form.setValue("optimizedPrompt", rawPromptValue) // Revert on failure
            toast.error(`Optimization failed: ${errorMessage}`)
          }

          // Handle Title Generation Result
          if (
            titleResult.status === "fulfilled" &&
            titleResult.value.isSuccess
          ) {
            form.setValue("title", titleResult.value.data)
            form.clearErrors("title")
            titleSuccess = true
          } else {
            const errorMessage =
              titleResult.status === "fulfilled"
                ? titleResult.value.message
                : "Title generation failed unexpectedly."
            form.setError("title", { type: "manual", message: errorMessage })
            form.setValue("title", "") // Clear on failure
            toast.error(`Title generation failed: ${errorMessage}`)
          }

          if (optimizedSuccess && titleSuccess) {
            toast.success(
              "Prompt optimized and title generated! Review and save."
            )
            setStep("refine") // Move to the next step on success
          } else {
            // Stay on input step if anything failed, errors were shown
            toast.warning(
              "Optimization or title generation failed. Please review errors."
            )
            // If only title failed, user might still want to proceed after fixing title manually?
            // Or force them back? For now, stay on input step.
          }
        } catch (error) {
          console.error("Error during optimization/title generation:", error)
          toast.error("An unexpected error occurred during optimization.")
          // rawPromptValue is guaranteed to be a string here due to the earlier check
          form.setValue("optimizedPrompt", rawPromptValue) // Revert
          form.setValue("title", "") // Clear
        }
      })
    })
  }

  const onSubmit = (values: CreatePromptFormValues) => {
    // Determine whether to create or update
    startSaveTransition(async () => {
      try {
        let result
        if (isEditMode && initialData) {
          // Update existing prompt
          result = await updatePromptTemplateAction(initialData.id, {
            title: values.title,
            optimizedPrompt: values.optimizedPrompt,
            // Update to send modelId
            modelId: values.modelId
            // defaultLlmProvider: values.defaultLlmProvider // Remove old provider
            // rawPrompt is not updated in edit mode
          })
          if (result.isSuccess) {
            toast.success(result.message || "Prompt updated successfully!")
            setIsOpen(false) // Close modal on success
            router.refresh() // Refresh the list page
            // Note: No specific tracking event for 'update' in this step's plan
          } else {
            toast.error(result.message || "Failed to update prompt.")
          }
        } else {
          // Create new prompt
          result = await createPromptTemplateAction({
            rawPrompt: values.rawPrompt ?? "", // Ensure rawPrompt is included if needed by action
            optimizedPrompt: values.optimizedPrompt,
            title: values.title,
            // Update to send modelId
            modelId: values.modelId
            // defaultLlmProvider: values.defaultLlmProvider // Remove old provider
          })

          if (result.isSuccess) {
            toast.success(result.message || "Prompt created successfully!")
            posthog?.capture("prompt_template_created", {
              promptId: result.data.id // Include promptId in tracking
            })
            setIsOpen(false) // Close modal on success
            router.refresh() // Refresh the list page
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

  // Reset form completely when modal is closed, regardless of initial mode
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset to default create state when closing
      form.reset({
        rawPrompt: "", // Reset to empty string for create mode default
        optimizedPrompt: "",
        title: "",
        modelId: availableModels[0].id
      })
      setStep("input")
    } else {
      // When opening, ensure state matches current props
      if (isEditMode && initialData) {
        form.reset({
          rawPrompt: initialData.rawPrompt ?? undefined, // Use undefined as default
          optimizedPrompt: initialData.optimizedPrompt,
          title: initialData.title,
          modelId: initialData.modelId
        })
        setStep("refine")
      } else {
        form.reset({
          rawPrompt: "", // Reset to empty string for create mode default
          optimizedPrompt: "",
          title: "",
          modelId: availableModels[0].id
        })
        setStep("input")
      }
    }
  }

  return (
    // Remove the internal DialogTrigger, use the passed children instead
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* Render the trigger element passed as children */}
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          {/* Title changes based on step and mode */}
          <DialogTitle>
            {isEditMode
              ? "Edit Prompt Template"
              : step === "input"
                ? "Generate a prompt"
                : "Step 2: Refine & Save Prompt"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Refine the prompt details and save your changes."
              : step === "input"
                ? "You can generate a prompt template by sharing basic details about your task"
                : "Review the optimized prompt and generated title. Make edits if needed, select the default LLM, and save."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          {/* Use onSubmit for the final step ('refine') in both modes */}
          <form
            onSubmit={
              step === "refine"
                ? form.handleSubmit(onSubmit)
                : e => e.preventDefault()
            }
            className="space-y-6 pt-4"
          >
            {/* Step 1: Input Raw Prompt - Only show in create mode */}
            {step === "input" && !isEditMode && (
              <FormField
                control={form.control}
                name="rawPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your task..."
                        rows={8} // Increased rows for initial input
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Step 2: Refine Optimized Prompt, Title, and Provider - Show in refine step (both modes) */}
            {step === "refine" && (
              <>
                {/* Raw Prompt Display (Readonly) - Optional for context in edit mode */}
                {isEditMode && initialData?.rawPrompt && (
                  <FormItem>
                    <FormLabel>Original Raw Prompt (Readonly)</FormLabel>
                    <FormControl>
                      <Textarea
                        value={initialData.rawPrompt ?? ""} // Keep using ?? "" for display value
                        readOnly
                        rows={4}
                        className="bg-muted/50" // Indicate readonly status
                      />
                    </FormControl>
                    <FormDescription>
                      This was the original input for optimization. It cannot be
                      edited here.
                    </FormDescription>
                  </FormItem>
                )}

                <FormField
                  control={form.control}
                  name="optimizedPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Optimized Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="The AI-optimized prompt will appear here..."
                          rows={7}
                          {...field}
                          readOnly={isOptimizing} // Should not be optimizing here, but keep for safety
                          className={cn(
                            isOptimizing && "text-muted-foreground italic"
                          )}
                        />
                      </FormControl>
                      <FormDescription>
                        {isEditMode
                          ? "Edit the optimized prompt."
                          : "Review and edit the refined prompt if needed."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="A descriptive title (e.g., Blog Post Intro Generator)"
                          {...field}
                          readOnly={isOptimizing} // Should not be optimizing here
                          className={cn(
                            isOptimizing && "text-muted-foreground italic"
                          )}
                        />
                      </FormControl>
                      <FormDescription>
                        {isEditMode
                          ? "Edit the prompt title."
                          : "Review and edit the generated title."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  // Ensure name is modelId
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                      <FormDescription>
                        Select the specific model for this template.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Footer buttons change based on step and mode */}
            <DialogFooter className="pt-4">
              {step === "input" &&
                !isEditMode && ( // Only show optimize button in create mode step 1
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button" // Changed from submit
                      onClick={handleOptimize}
                      disabled={isOptimizing}
                    >
                      {isOptimizing ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 size-4" />
                      )}
                      Optimize & Continue
                    </Button>
                  </>
                )}
              {step === "refine" && ( // Show back/save in refine step (both modes)
                <>
                  {/* Only show back button if not in edit mode (edit mode starts at refine) */}
                  {!isEditMode && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("input")} // Go back
                      disabled={isSaving}
                    >
                      <ArrowLeft className="mr-2 size-4" />
                      Back
                    </Button>
                  )}
                  {/* Always show Cancel/Close in Edit mode instead of Back */}
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)} // Close modal
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={isSaving}>
                    {" "}
                    {/* Submit triggers onSubmit */}
                    {isSaving ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    {/* Change button text based on mode */}
                    {isSaving
                      ? isEditMode
                        ? "Saving Changes..."
                        : "Saving..."
                      : isEditMode
                        ? "Save Changes"
                        : "Save Prompt"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
