/**
 * @description
 * This component handles the initial step of the prompt creation process.
 * Users input a raw prompt using the RichTextEditor, which is then sent for
 * optimization and title generation.
 * It manages the state for this modal, the loading state during optimization,
 * and transitions to the `CreatePromptRefineModal`.
 *
 * Key features:
 * - Captures raw prompt input using a Rich Text Editor.
 * - Supports snippet autocomplete (@mention) via the integrated editor.
 * - Initiates prompt optimization and title generation via LLM actions.
 * - Handles loading states during async operations.
 * - Navigates to the refine modal with optimization results.
 * - Allows navigating back from the refine modal.
 * - Caches the last successful optimization result for the same raw input.
 *
 * @dependencies
 * - react: Core React hooks (useState, useTransition, useCallback, useEffect).
 * - react-hook-form: Form state management and validation (useForm, Controller, Noop).
 * - @hookform/resolvers/zod: Zod schema validation for forms.
 * - zod: Schema definition.
 * - sonner: Toast notifications.
 * - lucide-react: Icons.
 * - posthog-js/react: Analytics tracking.
 * - @/components/ui/*: Shadcn UI components (Button, Dialog, Form).
 * - @/actions/llm-actions: Server actions for optimization and title generation.
 * - ./optimizing-loading-modal: Loading indicator modal.
 * - ./create-prompt-refine-modal: Next step modal in the flow.
 * - @/components/editor/rich-text-editor: The TipTap rich text editor component.
 *
 * @notes
 * - The editor saves plain text, including `@snippet-name` placeholders, via the Controller integration using `onTextChange`.
 * - Form validation ensures the raw prompt meets minimum length requirements.
 * - Caching mechanism prevents redundant API calls for identical prompts.
 * - Snippet fetching/suggestions are handled internally by the RichTextEditor/mention-extension.
 */
"use client"

import {
  useState,
  useTransition,
  ReactNode,
  useCallback,
  useEffect
} from "react"
import { useForm, Controller, Noop } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Sparkles } from "lucide-react"
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
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form"
import RichTextEditor from "@/components/editor/rich-text-editor"

import {
  optimizePromptAction,
  generateTitleAction
} from "@/actions/llm-actions"

import OptimizingLoadingModal from "./optimizing-loading-modal"
import CreatePromptRefineModal, {
  type InitialOptimizationData
} from "./create-prompt-refine-modal"

const inputFormSchema = z.object({
  rawPrompt: z.string().min(10, {
    message: "Raw prompt must be at least 10 characters."
  })
})

type InputFormValues = z.infer<typeof inputFormSchema>

interface CreatePromptInputModalProps {
  children: ReactNode
}

export default function CreatePromptInputModal({
  children
}: CreatePromptInputModalProps) {
  // State for this modal
  const [isInputModalOpen, setIsInputModalOpen] = useState(false)
  const [lastSubmittedRawPrompt, setLastSubmittedRawPrompt] = useState<
    string | null
  >(null)

  // State for loading modal
  const [isOptimizing, startOptimizeTransition] = useTransition()

  // State for refine modal
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false)
  const [optimizationData, setOptimizationData] =
    useState<InitialOptimizationData | null>(null)

  const posthog = usePostHog()

  const form = useForm<InputFormValues>({
    resolver: zodResolver(inputFormSchema),
    defaultValues: {
      rawPrompt: ""
    }
  })

  const handleOptimize = (values: InputFormValues) => {
    const rawPromptValue = values.rawPrompt

    if (
      rawPromptValue === lastSubmittedRawPrompt &&
      optimizationData &&
      !isOptimizing
    ) {
      toast.info("Using previously optimized result.")
      setIsInputModalOpen(false)
      setIsRefineModalOpen(true)
      return
    }

    startOptimizeTransition(async () => {
      setLastSubmittedRawPrompt(rawPromptValue)

      setIsInputModalOpen(false)

      toast.info("Optimizing prompt and generating title...")

      try {
        const [optimizeResult, titleResult] = await Promise.allSettled([
          optimizePromptAction(rawPromptValue),
          generateTitleAction(rawPromptValue)
        ])

        let optimizedPrompt = ""
        let title = ""
        let optimizeError: string | null = null
        let titleError: string | null = null

        if (
          optimizeResult.status === "fulfilled" &&
          optimizeResult.value.isSuccess
        ) {
          optimizedPrompt = optimizeResult.value.data
          posthog?.capture("prompt_template_optimized")
        } else {
          optimizeError =
            optimizeResult.status === "fulfilled"
              ? optimizeResult.value.message
              : "Optimization failed unexpectedly."
          toast.error(`Optimization failed: ${optimizeError}`)
        }

        if (titleResult.status === "fulfilled" && titleResult.value.isSuccess) {
          title = titleResult.value.data
        } else {
          titleError =
            titleResult.status === "fulfilled"
              ? titleResult.value.message
              : "Title generation failed unexpectedly."
          toast.error(`Title generation failed: ${titleError}`)
        }

        if (!optimizeError && !titleError) {
          toast.success(
            "Prompt optimized and title generated! Review and save."
          )
          const newOptimizationData = {
            rawPrompt: rawPromptValue,
            optimizedPrompt: optimizedPrompt,
            title: title
          }
          setOptimizationData(newOptimizationData)
          setIsRefineModalOpen(true)
        } else {
          toast.warning(
            "Optimization or title generation failed. Please review errors and try again."
          )
          setLastSubmittedRawPrompt(null)
          setOptimizationData(null)
        }
      } catch (error) {
        console.error("Error during optimization/title generation:", error)
        toast.error("An unexpected error occurred during optimization.")
        setLastSubmittedRawPrompt(null)
        setOptimizationData(null)
      }
    })
  }

  const handleInputOpenChange = (open: boolean) => {
    setIsInputModalOpen(open)
    if (open && !isRefineModalOpen) {
      form.reset({ rawPrompt: "" })
      setLastSubmittedRawPrompt(null)
      setOptimizationData(null)
    } else if (!open) {
      setOptimizationData(null)
      setLastSubmittedRawPrompt(null)
    }
  }

  const handleRefineOpenChange = (open: boolean) => {
    setIsRefineModalOpen(open)
    if (!open && !isInputModalOpen) {
      setOptimizationData(null)
      setLastSubmittedRawPrompt(null)
    }
  }

  const handleNavigateBackFromRefine = useCallback(() => {
    setIsRefineModalOpen(false)
    setIsInputModalOpen(true)
    if (lastSubmittedRawPrompt) {
      form.setValue("rawPrompt", lastSubmittedRawPrompt, {
        shouldValidate: true
      })
    }
  }, [form, lastSubmittedRawPrompt])

  return (
    <>
      <Dialog open={isInputModalOpen} onOpenChange={handleInputOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Create Prompt Template
            </DialogTitle>
            <DialogDescription>
              Describe the task for your prompt, including any reusable{" "}
              <code className="bg-muted rounded px-1 py-0.5">@snippet</code>{" "}
              placeholders. We'll optimize it for you.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleOptimize)}
              className="space-y-6 pt-4"
            >
              <FormField
                control={form.control}
                name="rawPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Controller
                        control={form.control}
                        name="rawPrompt"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <RichTextEditor
                            value={value}
                            onTextChange={onChange}
                            onBlur={onBlur as Noop}
                            placeholder="Example: Write a marketing email announcing our new {{product_name}} using the @company-overview snippet..."
                            disabled={isOptimizing}
                            aria-label="Raw Prompt Input"
                          />
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInputModalOpen(false)}
                  disabled={isOptimizing}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isOptimizing}>
                  {isOptimizing ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 size-4" />
                  )}
                  Optimize & Continue
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <OptimizingLoadingModal isOpen={isOptimizing} />

      {optimizationData && (
        <CreatePromptRefineModal
          isOpen={isRefineModalOpen}
          onOpenChange={handleRefineOpenChange}
          initialData={optimizationData}
          isEditMode={false}
          onBack={handleNavigateBackFromRefine}
        />
      )}
    </>
  )
}
