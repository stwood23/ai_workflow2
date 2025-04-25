/**
 * @description
 * This component provides a reusable rich-text editor using TipTap v3.
 * It wraps the TipTap editor core and exposes a controlled interface
 * similar to standard form inputs, allowing integration with forms (e.g., react-hook-form).
 * It includes the StarterKit for basic rich-text features and Placeholder support.
 *
 * Key features:
 * - Basic rich-text formatting (bold, italic, etc.) via StarterKit.
 * - Controlled component interface (`value` for HTML, `onTextChange` for plain text).
 * - Placeholder text support.
 * - Context snippet mention support with '@' trigger.
 * - Optional disabled state.
 * - Styled to resemble Shadcn UI inputs for visual consistency.
 * - Always uses light mode styling regardless of app theme.
 *
 * @dependencies
 * - @tiptap/react: Core TipTap library for React integration (useEditor, EditorContent, Editor).
 * - @tiptap/starter-kit: Bundle of essential TipTap extensions.
 * - @tiptap/extension-placeholder: Extension for displaying placeholder text.
 * - @tiptap/extension-mention: Extension for '@' mentions.
 * - react: Core React library (useEffect).
 * - ./mention-extension: Configuration for the Mention extension.
 * - @/db/schema: Snippet types (SelectContextSnippet).
 *
 * @props
 * - value: string - The initial HTML content for the editor.
 * - onChange?: (value: string) => void - (Optional) Callback invoked with HTML content when editor content changes.
 * - onTextChange?: (value: string) => void - (Optional) Callback invoked with plain text content when editor content changes.
 * - disabled?: boolean - If true, the editor is not editable.
 * - placeholder?: string - Placeholder text to show when the editor is empty.
 */
"use client"

import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import React, { CSSProperties, useEffect, useRef } from "react"
import { configureMention } from "./mention-extension"
import { SelectContextSnippet } from "@/db/schema" // Import snippet type

interface RichTextEditorProps {
  value: string
  onChange?: (value: string) => void // HTML change callback (optional)
  onTextChange?: (value: string) => void // Plain text change callback (optional)
  disabled?: boolean
  placeholder?: string
  // Allow any other props like aria-label
  [key: string]: any
}

// Define light mode CSS variables - will be cast to CSSProperties when applied
const lightModeVars = {
  "--background": "0 0% 100%",
  "--foreground": "222.2 84% 4.9%",
  "--card": "0 0% 100%",
  "--card-foreground": "222.2 84% 4.9%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "222.2 84% 4.9%",
  "--primary": "158 56% 35%",
  "--primary-foreground": "210 40% 98%",
  "--secondary": "210 40% 96.1%",
  "--secondary-foreground": "222.2 47.4% 11.2%",
  "--muted": "210 40% 96.1%",
  "--muted-foreground": "215.4 16.3% 46.9%",
  "--accent": "210 40% 96.1%",
  "--accent-foreground": "222.2 47.4% 11.2%",
  "--destructive": "0 84.2% 60.2%",
  "--destructive-foreground": "210 40% 98%",
  "--border": "214.3 31.8% 91.4%",
  "--input": "214.3 31.8% 91.4%",
  "--ring": "252 56% 57%"
}

export default function RichTextEditor({
  value,
  onChange,
  onTextChange, // Added prop
  disabled = false,
  placeholder = "",
  ...props // Capture rest props
}: RichTextEditorProps) {
  // Keep track of whether we're currently handling an update to prevent loops
  const isUpdatingRef = useRef(false)
  // Store the most recent editor HTML to compare with incoming value
  const currentHtmlRef = useRef(value)
  // Reference to the editor container
  const editorContainerRef = useRef<HTMLDivElement>(null)

  const mentionExtension = configureMention()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure StarterKit options here if needed
      }),
      Placeholder.configure({
        placeholder: placeholder
      }),
      mentionExtension
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }: { editor: Editor }) => {
      // Skip if we're in the middle of an update from parent
      if (isUpdatingRef.current) return

      const html = editor.getHTML()
      const text = editor.getText()

      // Store current HTML for comparison
      currentHtmlRef.current = html

      // Call original onChange with HTML if provided
      if (onChange) {
        onChange(html)
      }
      // Call new onTextChange with plain text if provided
      if (onTextChange) {
        onTextChange(text)
      }
    },
    editorProps: {
      attributes: {
        // Pass down other props like aria-label
        ...props,
        class: "overflow-y-auto h-full" // Add overflow and height to ProseMirror
      }
    }
  })

  // Apply scroll styles to ProseMirror element after editor is loaded
  useEffect(() => {
    if (editor && editorContainerRef.current) {
      // Apply scroll styles to ProseMirror element
      const applyStyles = () => {
        const proseMirror =
          editorContainerRef.current?.querySelector(".ProseMirror")
        if (proseMirror instanceof HTMLElement) {
          // Apply strong inline styles with !important to override any conflicting styles
          proseMirror.style.cssText += `
            height: 100% !important;
            max-height: 100% !important;
            overflow-y: auto !important;
            display: block !important;
            position: relative !important;
          `
        }
      }

      // Apply styles multiple times to ensure they stick through any re-renders or post-load operations
      applyStyles()
      setTimeout(applyStyles, 100)
      setTimeout(applyStyles, 500)

      // Monitor for changes and reapply if needed
      const observer = new MutationObserver(() => {
        applyStyles()
      })

      if (editorContainerRef.current) {
        observer.observe(editorContainerRef.current, {
          childList: true,
          subtree: true
        })
      }

      return () => {
        observer.disconnect()
      }
    }
  }, [editor])

  // Update editor content if the external value prop changes
  React.useEffect(() => {
    if (editor && !editor.isDestroyed) {
      // Skip if editor already has this content or if the editor is focused
      // This prevents overwriting user input (especially spaces)
      if (currentHtmlRef.current === value || editor.isFocused) {
        return
      }

      // Set flag to prevent onUpdate from triggering during this update
      isUpdatingRef.current = true
      editor.commands.setContent(value, false)

      // Update our ref with the new value
      currentHtmlRef.current = value

      // Reset the flag after a short delay to ensure the update is complete
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 10)
    }
  }, [value, editor])

  return (
    <div
      // Force light mode by overriding CSS variables - explicit cast to CSSProperties
      style={{
        ...(lightModeVars as CSSProperties),
        height: "100%",
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column"
      }}
      className={`
        tiptap-editor
        border-input ring-offset-background focus-within:ring-ring min-h-[80px] w-full rounded-md border bg-white px-3
        py-2
        text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
        not-dark
        [&_.ProseMirror]:text-foreground
        [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground
        /*
        Basic
        spacing
        for
        rendered
        Markdown
        */
        [&_.ProseMirror_hr]:border-border
        [&_.ProseMirror_pre]:bg-muted
        /*
        Mention
        styles for light mode only */ block [&_.ProseMirror]:block
        [&_.ProseMirror]:h-full
        [&_.ProseMirror]:max-h-full
        [&_.ProseMirror]:min-h-[60px]
        [&_.ProseMirror]:overflow-y-auto
        [&_.ProseMirror]:text-black
        [&_.ProseMirror]:outline-none
        [&_.ProseMirror_blockquote]:mb-3
        [&_.ProseMirror_blockquote]:border-l-4
        [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_h1]:mb-5 [&_.ProseMirror_h2]:mb-4
        [&_.ProseMirror_h3]:mb-3 [&_.ProseMirror_h4]:mb-3
        [&_.ProseMirror_hr]:my-4 [&_.ProseMirror_li]:mb-1 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
        [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_pre]:mb-3 [&_.ProseMirror_pre]:rounded [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_ul]:mb-3
        [&_.mention]:mr-1
        [&_.mention]:inline-flex
        [&_.mention]:items-center
        [&_.mention]:rounded
        [&_.mention]:bg-sky-100
        [&_.mention]:px-1.5
        [&_.mention]:py-0.5
        [&_.mention]:text-sky-700
      `}
      ref={editorContainerRef}
      {...props} // Pass any additional props
    >
      <EditorContent
        editor={editor}
        className="h-full overflow-hidden"
        style={{ height: "100%", overflow: "hidden" }}
      />
    </div>
  )
}
