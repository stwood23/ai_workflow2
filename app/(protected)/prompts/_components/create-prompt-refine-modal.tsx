/**
 * @file app/(protected)/prompts/_components/create-prompt-refine-modal.tsx
 * @description This file defines the CreatePromptRefineModal component, a client-side
 * React component responsible for handling the final review, editing, and saving
 * of prompt templates. It serves two main purposes:
 * 1. Editing an existing prompt template: Loaded with data from a `SelectPromptTemplate`.
 * 2. Refining a newly created prompt: Loaded with `InitialOptimizationData` (raw prompt,
 *    AI-optimized prompt, AI-generated title) from a previous step.
 *
 * The modal allows users to:
 * - Edit the prompt template's title (click-to-edit).
 * - Select the target LLM model for the template.
 * - Review and edit the AI-optimized prompt text using a Rich Text Editor.
 * - View detected placeholders (`{{variable}}`) and context snippets (`@snippet`)
 *   extracted from the relevant prompt texts.
 * - Save the changes (either updating an existing template or creating a new one).
 * - Navigate back (in create mode) or cancel (in edit mode).
 *
 * It utilizes `react-hook-form` for form management and validation (`zod`),
 * `shadcn/ui` components for the UI elements (Dialog, Form, Input, Select, Badge, Tooltip),
 * `lucide-react` for icons, `sonner` for notifications, and `useTransition` for handling
 * asynchronous save operations gracefully. It integrates with the `RichTextEditor`
 * for the main prompt field.
 *
 * @module CreatePromptRefineModal
 * @requires react
 * @requires next/navigation
 * @requires react-hook-form (useForm, useWatch, Controller, Noop)
 * @requires @hookform/resolvers/zod
 * @requires zod
 * @requires sonner
 * @requires lucide-react
 * @requires posthog-js/react
 * @requires @/components/ui/* - various shadcn components
 * @requires @/actions/db/prompts-actions - Server actions for DB operations
 * @requires @/lib/utils - Utility functions (e.g., cn)
 * @requires @/db/schema - Database schema types (`SelectPromptTemplate`)
 * @requires @/components/editor/rich-text-editor - The TipTap editor component
 */
"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch, Controller, Noop } from "react-hook-form" // Added Controller, Noop
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Pencil, Info } from "lucide-react"
import { usePostHog } from "posthog-js/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import RichTextEditor from "@/components/editor/rich-text-editor" // Added
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  createPromptTemplateAction,
  updatePromptTemplateAction
} from "@/actions/db/prompts-actions"
import { cn, convertMarkdownToHtml } from "@/lib/utils"
import { SelectPromptTemplate } from "@/db/schema"

/**
 * @constant availableModels
 * @description A list of available Large Language Models (LLMs) that can be associated with a prompt template.
 * Each object contains the model's unique ID and a user-friendly display name.
 * The `as const` assertion ensures the array and its elements are treated as literal types for better type safety.
 */
const availableModels = [
  { id: "gpt-4o", name: "OpenAI - GPT-4o" },
  { id: "gpt-4o-mini", name: "OpenAI - GPT-4o Mini" },
  { id: "gpt-4-turbo", name: "OpenAI - GPT-4 Turbo" },
  { id: "claude-3-5-sonnet-20240620", name: "Anthropic - Claude 3.5 Sonnet" },
  { id: "claude-3-opus-20240229", name: "Anthropic - Claude 3 Opus" },
  { id: "grok-1.5", name: "xAI - Grok 1.5" }
] as const

/**
 * @constant modelIds
 * @description An array derived from `availableModels` containing only the model IDs.
 * Used for validation purposes within the form schema.
 */
const modelIds = availableModels.map(m => m.id)

/**
 * @constant snippetRegex
 * @description Regex to find all occurrences of @snippet names (e.g., @company-info).
 * Captures the name part after the '@'.
 */
const snippetRegex = /@(\w+)/g // Use \w+ to match alphanumeric and underscores

/**
 * @constant placeholderRegex
 * @description Regex to find all occurrences of {{placeholder}} variables.
 * Captures the text inside the double braces.
 */
const placeholderRegex = /\{\{(.*?)\}\}/g // Existing regex

/**
 * @constant formSchema
 * @description Zod schema defining the structure and validation rules for the prompt refinement form.
 * - `rawPrompt`: Optional string, used internally when creating a new prompt (not shown in this modal).
 * - `optimizedPrompt`: Required string, must be at least 10 characters. Represents the main prompt text.
 * - `title`: Required string, must be at least 3 characters. The user-facing name of the prompt template.
 * - `modelId`: Required string, must be one of the IDs defined in `modelIds`.
 */
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

/**
 * @interface CreatePromptFormValues
 * @description TypeScript type inferred from the `formSchema`. Represents the expected shape of the form data.
 */
export type CreatePromptFormValues = z.infer<typeof formSchema>

/**
 * @interface InitialOptimizationData
 * @description Defines the shape of the data passed to the modal when refining a *newly* created prompt
 * (i.e., data coming from the initial input/optimization step).
 * @property {string} rawPrompt - The original prompt entered by the user.
 * @property {string} optimizedPrompt - The prompt after being processed/optimized by an LLM.
 * @property {string} title - A title suggested by an LLM based on the prompt.
 * @property {string} [modelId] - An optional initial model ID (e.g., if selected in a previous step).
 */
export interface InitialOptimizationData {
  rawPrompt: string
  optimizedPrompt: string // This will be plain text now
  title: string
  modelId?: string
}

/**
 * @interface CreatePromptRefineModalProps
 * @description Props accepted by the `CreatePromptRefineModal` component.
 * @property {SelectPromptTemplate | InitialOptimizationData} initialData - The data to populate the form.
 *           If it's a `SelectPromptTemplate`, the modal is in "edit" mode.
 *           If it's `InitialOptimizationData`, the modal is in "create refinement" mode.
 * @property {boolean} isEditMode - Flag indicating whether the modal is for editing an existing prompt (true) or refining a new one (false).
 * @property {boolean} isOpen - Controls the visibility of the modal dialog. Managed by the parent component.
 * @property {(open: boolean) => void} onOpenChange - Callback function invoked when the modal's open state should change (e.g., closing via 'x' button, overlay click, or successful save).
 * @property {() => void} [onBack] - Optional callback function invoked when the "Back" button is clicked (only relevant in create mode). Allows navigation back to the previous step.
 */
interface CreatePromptRefineModalProps {
  initialData: SelectPromptTemplate | InitialOptimizationData
  isEditMode: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onBack?: () => void
}

/**
 * @function CreatePromptRefineModal
 * @description The main component for the prompt refinement/editing dialog.
 * It handles form state, validation, UI rendering, placeholder extraction,
 * and interaction logic for saving or canceling prompt template changes.
 *
 * @param {CreatePromptRefineModalProps} props - The component props.
 * @returns {React.ReactElement} The rendered modal dialog component.
 *
 * @behavior
 * - Initializes a form using `react-hook-form` and `zodResolver`.
 * - Populates the form with `initialData` when the modal opens or data changes.
 * - Provides a click-to-edit interface for the prompt title.
 * - Allows selection of an associated LLM model via a dropdown.
 * - Displays the `optimizedPrompt` in a `Textarea` for review and editing.
 * - Automatically extracts placeholders (`{{placeholder}}`) from the `optimizedPrompt`
 *   and displays them as `Badge` components (using the default variant for emphasis)
 *   in a dedicated "Inputs" section.
 * - Handles form submission:
 *   - Calls `updatePromptTemplateAction` if `isEditMode` is true.
 *   - Calls `createPromptTemplateAction` if `isEditMode` is false.
 * - Shows loading states during save operations using `useTransition`.
 * - Displays success or error notifications using `sonner`.
 * - Calls `onOpenChange(false)` to close the modal on successful save or cancellation.
 * - Calls `onBack()` if provided when the "Back" button is clicked in create mode.
 * - Resets internal states (like `isEditingTitle`) when the modal closes.
 *
 * @edgeCases
 * - Handles cases where `initialData` might be missing or incomplete (though type safety should minimize this).
 * - Provides feedback if form validation fails.
 * - Catches errors during server action calls and displays generic error messages.
 * - Displays a message if no placeholders are detected in the `optimizedPrompt`.
 *
 * @assumptions
 * - Assumes `initialData` is correctly provided based on the mode (`isEditMode`).
 * - Assumes the server actions (`createPromptTemplateAction`, `updatePromptTemplateAction`)
 *   return the expected `ActionState` structure.
 * - Assumes the existence of required environment variables for server actions.
 *
 * @notes
 * - Placeholder extraction uses a simple regex (`/\{\{(.*?)\}\}/g`). It doesn't handle nested placeholders
 *   or complex syntax within the braces.
 * - The `rawPrompt` is included in the form state and passed to the `create` action, but it's not
 *   displayed or editable within this specific modal component.
 * - PostHog analytics event `prompt_template_created` is fired only on successful creation.
 */
export default function CreatePromptRefineModal({
  initialData,
  isEditMode,
  isOpen,
  onOpenChange,
  onBack
}: CreatePromptRefineModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [extractedInputs, setExtractedInputs] = useState<string[]>([])
  const [extractedSnippets, setExtractedSnippets] = useState<string[]>([]) // New state for snippets
  const [isSaving, startSaveTransition] = useTransition()
  const router = useRouter()
  const posthog = usePostHog()

  const form = useForm<CreatePromptFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rawPrompt: "",
      optimizedPrompt: "", // Initial value for the editor
      title: "",
      modelId: availableModels[0].id
    }
  })

  // Watch the optimized prompt value for placeholder extraction
  const optimizedPromptValue = useWatch({
    control: form.control,
    name: "optimizedPrompt"
  })

  // Watch the raw prompt value for snippet extraction (only in create mode)
  const rawPromptValue = useWatch({
    control: form.control,
    name: "rawPrompt"
  })

  // Effect to extract placeholders from optimizedPromptValue
  useEffect(() => {
    if (optimizedPromptValue) {
      const matches = optimizedPromptValue.matchAll(placeholderRegex)
      const uniqueInputs = [...new Set(Array.from(matches, m => m[1].trim()))]
      setExtractedInputs(uniqueInputs.filter(input => input.length > 0))
    } else {
      setExtractedInputs([])
    }
  }, [optimizedPromptValue])

  // Effect to extract snippets from rawPromptValue (only in create mode)
  useEffect(() => {
    if (!isEditMode && rawPromptValue) {
      const matches = rawPromptValue.matchAll(snippetRegex)
      const uniqueSnippets = [...new Set(Array.from(matches, m => m[1]))] // m[1] is the name without '@'
      setExtractedSnippets(uniqueSnippets.filter(snippet => snippet.length > 0))
    } else if (isEditMode && initialData && "id" in initialData) {
      // In edit mode, try to extract snippets from the *optimized* prompt
      // as the raw prompt might not be readily available or relevant
      const optimizedTextForSnippets = initialData.optimizedPrompt
      const matches = optimizedTextForSnippets.matchAll(snippetRegex)
      const uniqueSnippets = [...new Set(Array.from(matches, m => m[1]))]
      setExtractedSnippets(uniqueSnippets.filter(snippet => snippet.length > 0))
    } else {
      setExtractedSnippets([])
    }
  }, [rawPromptValue, isEditMode, initialData]) // Depend on rawPromptValue and mode

  // Effect to reset form and state when initialData changes or modal opens/closes
  useEffect(() => {
    const setFormData = async () => {
      if (isOpen && initialData) {
        // Convert Markdown optimized prompt to HTML for the editor
        const formattedOptimizedPrompt = await convertMarkdownToHtml(
          initialData.optimizedPrompt
        )

        if ("id" in initialData) {
          // Edit mode
          form.reset({
            rawPrompt: initialData.rawPrompt ?? undefined,
            optimizedPrompt: formattedOptimizedPrompt, // Use formatted HTML
            title: initialData.title,
            modelId: initialData.modelId
          })
        } else {
          // Create refinement mode
          form.reset({
            rawPrompt: initialData.rawPrompt,
            optimizedPrompt: formattedOptimizedPrompt, // Use formatted HTML
            title: initialData.title,
            modelId: initialData.modelId || availableModels[0].id
          })
        }
        setIsEditingTitle(false)
        // Extracted inputs/snippets will be updated by their respective useEffects
      } else if (!isOpen) {
        // Reset form and extracted items when modal closes
        form.reset({
          rawPrompt: "",
          optimizedPrompt: "", // Reset to empty string
          title: "",
          modelId: availableModels[0].id
        })
        setIsEditingTitle(false)
        setExtractedInputs([])
        setExtractedSnippets([]) // Clear snippets on close
      }
    }

    setFormData()
  }, [initialData, isOpen, isEditMode, form])

  /**
   * @function onSubmit
   * @description Handles the form submission logic. It determines whether to call
   * the create or update server action based on `isEditMode`. Shows loading
   * indicators and toasts for feedback.
   * @param {CreatePromptFormValues} values - The validated form values.
   * @async
   */
  const onSubmit = (values: CreatePromptFormValues) => {
    // Ensure title editing is finished before submitting
    if (isEditingTitle) {
      setIsEditingTitle(false)
      // Add a small delay to allow the input blur to register if needed,
      // or simply rely on the button being disabled while isEditingTitle is true.
      // For simplicity, we disable the submit button while editing title.
      return
    }

    startSaveTransition(async () => {
      try {
        let result
        if (isEditMode && initialData && "id" in initialData) {
          // --- Update Existing Prompt ---
          // Ensure initialData is the DB record type before accessing id
          result = await updatePromptTemplateAction(initialData.id, {
            title: values.title,
            optimizedPrompt: values.optimizedPrompt,
            modelId: values.modelId
            // rawPrompt is intentionally NOT updated during edit
          })

          if (result.isSuccess) {
            toast.success(result.message || "Prompt updated successfully!")
            onOpenChange(false) // Close modal via callback
            router.refresh() // Refresh data on the page
          } else {
            toast.error(result.message || "Failed to update prompt.")
          }
        } else {
          // --- Create New Prompt ---
          // rawPrompt MUST be present in form values for create action
          if (values.rawPrompt === undefined || values.rawPrompt === null) {
            console.error("Raw prompt is missing during create action.")
            toast.error("Cannot save prompt: Original prompt data is missing.")
            return // Prevent action call if rawPrompt isn't set
          }
          result = await createPromptTemplateAction({
            rawPrompt: values.rawPrompt, // Pass the raw prompt
            optimizedPrompt: values.optimizedPrompt,
            title: values.title,
            modelId: values.modelId
          })

          if (result.isSuccess && result.data?.id) {
            toast.success(result.message || "Prompt created successfully!")
            // Fire analytics event upon successful creation
            posthog?.capture("prompt_template_created", {
              promptId: result.data.id,
              modelId: values.modelId
            })
            onOpenChange(false) // Close modal via callback
            router.refresh() // Refresh data on the page
          } else {
            // Handle case where creation succeeded but didn't return expected data, or failed
            toast.error(
              result.message ||
                "Failed to create prompt or missing returned data."
            )
          }
        }
      } catch (error) {
        // Catch unexpected errors during the action call
        console.error(
          `Error ${isEditMode ? "updating" : "saving"} prompt template:`,
          error
        )
        toast.error(
          `An unexpected error occurred during ${isEditMode ? "update" : "save"}.`
        )
      }
    })
  }

  /**
   * @function handleInternalOpenChange
   * @description Wrapper around the `onOpenChange` prop to perform cleanup
   * (resetting `isEditingTitle`) before propagating the change.
   * @param {boolean} open - The new desired open state.
   */
  const handleInternalOpenChange = (open: boolean) => {
    if (!open) {
      // Reset states on close triggered by 'x', overlay, or cancel
      setIsEditingTitle(false)
      // Extracted inputs reset is handled in the main useEffect hook
    }
    onOpenChange(open) // Call the parent handler
  }

  /**
   * @function handleBackOrCancel
   * @description Handles the click event for the bottom-left button.
   * If in create mode (`!isEditMode`) and `onBack` prop is provided, it calls `onBack`.
   * Otherwise (edit mode or no `onBack` provided), it closes the modal.
   */
  const handleBackOrCancel = () => {
    if (!isEditMode && onBack) {
      // Navigate back in create flow
      onBack()
    } else {
      // Cancel edit or close create modal if no back handler
      handleInternalOpenChange(false)
    }
  }

  // --- Render Logic ---
  return (
    // Dialog controlled by parent component via isOpen and onOpenChange
    <Dialog open={isOpen} onOpenChange={handleInternalOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        {/* TooltipProvider needed for nested tooltips */}
        <DialogHeader>
          <DialogTitle className="sr-only">
            {isEditMode ? "Edit Prompt Template" : "Refine Prompt Template"}
          </DialogTitle>
        </DialogHeader>
        <TooltipProvider>
          <Form {...form}>
            {/* Form element handles submission */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3"
            >
              {/* Left Column: Title, Model, Inputs */}
              <div className="space-y-6 md:col-span-1">
                {/* ----- Click-to-edit Title ----- */}
                <FormItem className="space-y-1">
                  {isEditingTitle ? (
                    // Render input field when editing title
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormControl>
                          <Input
                            placeholder="Enter a descriptive title..."
                            {...field}
                            onBlur={() => setIsEditingTitle(false)} // Stop editing on blur
                            onKeyDown={e => {
                              // Stop editing on Enter key
                              if (e.key === "Enter") {
                                e.preventDefault() // Prevent form submission
                                setIsEditingTitle(false)
                              }
                            }}
                            autoFocus // Focus input when it appears
                            className="text-lg font-semibold" // Style to match h3
                          />
                        </FormControl>
                      )}
                    />
                  ) : (
                    // Render display title with edit icon when not editing
                    <div
                      className={cn(
                        "hover:border-input flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-2",
                        "transition-colors duration-150 ease-in-out" // Added transition
                      )}
                      onClick={() => setIsEditingTitle(true)} // Start editing on click
                      role="button" // Accessibility: Indicate it's clickable
                      tabIndex={0} // Accessibility: Make it focusable
                      onKeyDown={e => {
                        // Allow editing with Enter/Space key
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setIsEditingTitle(true)
                        }
                      }}
                    >
                      <h3 className="text-xl font-semibold leading-none tracking-tight">
                        {/* Display current title from form state or placeholder */}
                        {form.watch("title") || "Click to add title"}
                      </h3>
                      <Pencil className="text-muted-foreground size-4 shrink-0" />
                    </div>
                  )}
                  {/* Display validation errors for the title */}
                  <FormMessage>
                    {form.formState.errors.title?.message}
                  </FormMessage>
                </FormItem>

                {/* ----- Model Selection Dropdown ----- */}
                <FormField
                  control={form.control}
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      {/* Label with Tooltip */}
                      <div className="flex items-center gap-1.5">
                        <FormLabel>Model</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="text-muted-foreground size-4 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Select the target LLM for this template.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {/* Select Component */}
                      <Select
                        onValueChange={field.onChange} // Update form state on change
                        value={field.value} // Controlled component
                        disabled={isSaving} // Disable while saving
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Map available models to SelectItem options */}
                          {availableModels.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Display validation errors for model selection */}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ----- Inputs & Context Section ----- */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <FormLabel>Inputs & Context</FormLabel>{" "}
                    {/* Updated Header */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="text-muted-foreground size-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Detected{" "}
                          <code className="bg-muted rounded px-1 py-0.5 text-xs">
                            {"{{input}}"}
                          </code>{" "}
                          placeholders and{" "}
                          <code className="bg-muted rounded px-1 py-0.5 text-xs">
                            {"@snippet"}
                          </code>{" "}
                          references. Snippets will be injected during
                          generation.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {/* Render Placeholders */}
                  {extractedInputs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {extractedInputs.map((input, index) => (
                        <Badge key={`input-${index}`} variant="outline">
                          {"{{"} {input} {"}}"}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {/* Render Snippets */}
                  {extractedSnippets.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {extractedSnippets.map((snippet, index) => (
                        <Badge
                          key={`snippet-${index}`}
                          className="bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-100 dark:hover:bg-sky-800"
                        >
                          @{snippet}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {/* Message if neither are found */}
                  {extractedInputs.length === 0 &&
                  extractedSnippets.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No placeholders or snippets detected.
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Right Column: Optimized Prompt Editor */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-1.5">
                  <FormLabel htmlFor="optimizedPrompt">
                    Optimized Prompt
                  </FormLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="text-muted-foreground size-4 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Review and edit the AI-optimized prompt. This is what
                        will be saved and used for generation.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormField
                  control={form.control}
                  name="optimizedPrompt"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <FormItem>
                      <FormControl>
                        {/* Use Controller to integrate RichTextEditor */}
                        <Controller
                          control={form.control}
                          name="optimizedPrompt"
                          render={({ field: { onChange, value, onBlur } }) => (
                            <div
                              className="overflow-hidden"
                              style={{
                                height: "350px",
                                maxHeight: "350px",
                                minHeight: "350px",
                                position: "relative",
                                display: "flex",
                                flexDirection: "column"
                              }}
                            >
                              <RichTextEditor
                                value={value}
                                onTextChange={onChange}
                                onBlur={onBlur as Noop}
                                placeholder="The optimized prompt will appear here..."
                                disabled={isSaving}
                                aria-label="Optimized Prompt Editor"
                                id="optimizedPrompt"
                                style={{
                                  height: "100%",
                                  maxHeight: "100%",
                                  width: "100%",
                                  border: "none"
                                }}
                              />
                            </div>
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dialog Footer outside the grid */}
              <DialogFooter className="pt-4 md:col-span-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackOrCancel}
                  disabled={isSaving} // Disable while saving
                >
                  {/* Show Back in create mode, Cancel in edit mode */}
                  {!isEditMode && onBack ? "Back" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || isEditingTitle} // Disable if saving or editing title
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {isEditMode ? "Save Changes" : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  )
}
