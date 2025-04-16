"use client"

import { useState, useTransition, ReactNode } from "react"
import { useForm } from "react-hook-form"
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
  // Removed Label, FormDescription - not needed here
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import {
  optimizePromptAction,
  generateTitleAction
} from "@/actions/llm-actions"

// Import the other modals
import OptimizingLoadingModal from "./optimizing-loading-modal"
import CreatePromptRefineModal, {
  type InitialOptimizationData // Import the type for passing data
} from "./create-prompt-refine-modal"

// Schema only needs rawPrompt for this form
const inputFormSchema = z.object({
  rawPrompt: z.string().min(10, {
    message: "Raw prompt must be at least 10 characters."
  })
})

type InputFormValues = z.infer<typeof inputFormSchema>

interface CreatePromptInputModalProps {
  children: ReactNode // The trigger element
}

export default function CreatePromptInputModal({
  children
}: CreatePromptInputModalProps) {
  // State for this modal
  const [isInputModalOpen, setIsInputModalOpen] = useState(false)

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
    const rawPromptValue = values.rawPrompt // Already validated by form

    startOptimizeTransition(async () => {
      // Close input modal, open loading modal
      setIsInputModalOpen(false)
      // Note: isOptimizing state is automatically true during transition
      // We'll manually control the loading modal visibility based on the transition state
      // in the return statement below.

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

        // Handle Optimization Result
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

        // Handle Title Generation Result
        if (titleResult.status === "fulfilled" && titleResult.value.isSuccess) {
          title = titleResult.value.data
        } else {
          titleError =
            titleResult.status === "fulfilled"
              ? titleResult.value.message
              : "Title generation failed unexpectedly."
          toast.error(`Title generation failed: ${titleError}`)
        }

        // Proceed only if both succeeded
        if (!optimizeError && !titleError) {
          toast.success(
            "Prompt optimized and title generated! Review and save."
          )
          setOptimizationData({
            rawPrompt: rawPromptValue,
            optimizedPrompt: optimizedPrompt,
            title: title
          })
          setIsRefineModalOpen(true) // Open refine modal
          form.reset() // Reset input form for next time
        } else {
          // If failed, show error toasts (already done above)
          // Re-open the input modal? Or just let user close trigger?
          // Let's keep it closed and rely on toasts.
          // Maybe add a button in the toast to retry?
          toast.warning(
            "Optimization or title generation failed. Please review errors and try again."
          )
          // We could potentially re-open the input modal here if desired:
          // setIsInputModalOpen(true)
        }
      } catch (error) {
        console.error("Error during optimization/title generation:", error)
        toast.error("An unexpected error occurred during optimization.")
        // Optionally re-open input modal on unexpected errors
        // setIsInputModalOpen(true)
      }
      // isOptimizing automatically becomes false after transition ends
    })
  }

  // Reset form when input modal closes
  const handleInputOpenChange = (open: boolean) => {
    setIsInputModalOpen(open)
    if (!open) {
      form.reset()
    }
  }

  // Handler for when the refine modal closes
  const handleRefineOpenChange = (open: boolean) => {
    setIsRefineModalOpen(open)
    if (!open) {
      setOptimizationData(null) // Clear data when refine modal closes
    }
  }

  return (
    <>
      {/* Input Modal Trigger and Content */}
      <Dialog open={isInputModalOpen} onOpenChange={handleInputOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        {/* Use original narrow width */}
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Prompt Template</DialogTitle>
            <DialogDescription>
              Describe the task for your prompt, and we'll optimize it for you.
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
                      <Textarea
                        placeholder="Example: Write a marketing email announcing a new product launch..."
                        rows={8}
                        {...field}
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

      {/* Loading Modal - controlled by optimizing transition state */}
      <OptimizingLoadingModal isOpen={isOptimizing} />

      {/* Refine Modal - controlled by its own state */}
      {optimizationData && (
        <CreatePromptRefineModal
          isOpen={isRefineModalOpen}
          onOpenChange={handleRefineOpenChange}
          initialData={optimizationData} // Pass the fetched data
          isEditMode={false} // Always false when coming from input modal
        />
      )}
    </>
  )
}
