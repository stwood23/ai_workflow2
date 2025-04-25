/**
 * @description
 * Configuration for the TipTap Mention extension (@tiptap/extension-mention).
 * Handles fetching snippet suggestions, rendering the suggestion list using Shadcn Command,
 * and managing keyboard navigation within the list.
 *
 * @dependencies
 * - @tiptap/extension-mention: The core TipTap Mention extension.
 * - @tiptap/react: Provides types and utilities for React integration (SuggestionProps, ReactRenderer).
 * - react: Core React library (useState, useEffect, forwardRef).
 * - @/lib/snippets-autocomplete: Client-side helper to fetch snippets.
 * - @/components/ui/command: Shadcn UI Command components for rendering the list.
 * - @/db/schema: Context snippet type (SelectContextSnippet).
 * - tippy.js: Used internally by the Mention extension for positioning.
 *
 * @key_features
 * - Configures mention trigger character ('@').
 * - Uses `fetchSnippets` (debounced) to get suggestions.
 * - Renders suggestions in a Shadcn Command component.
 * - Handles keyboard navigation (Up, Down, Enter) and selection.
 * - Displays an empty state message.
 */

import Mention from "@tiptap/extension-mention"
import { ReactRenderer } from "@tiptap/react"
import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle
} from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import { fetchSnippets } from "@/lib/snippets-autocomplete"
import { SelectContextSnippet } from "@/db/schema"
import tippy from "tippy.js"
import type { Instance, Props as TippyProps } from "tippy.js"
import { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion"

// Define the structure for the Mention item
interface MentionItem {
  id: string
  label: string
}

// Props for the MentionList component
interface MentionListProps {
  items: SelectContextSnippet[]
  command: (item: MentionItem) => void
}

// Ref handle type for the MentionList component
interface MentionListRef {
  onKeyDown: (event: KeyboardEvent) => boolean
}

// Suggestion List Component for Mentions
const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        command({ id: item.name, label: item.name })
      }
    }

    // Reset index when items change
    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    // Scroll selected item into view logic
    useEffect(() => {
      const container = scrollContainerRef.current
      const itemEl = container?.querySelector(`[data-index="${selectedIndex}"]`)
      if (itemEl && container) {
        const itemRect = itemEl.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        if (itemRect.bottom > containerRect.bottom) {
          container.scrollTop += itemRect.bottom - containerRect.bottom
        } else if (itemRect.top < containerRect.top) {
          container.scrollTop -= containerRect.top - itemRect.top
        }
      }
    }, [selectedIndex])

    // Expose keydown handler via ref
    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length)
          return true
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((selectedIndex + 1) % items.length)
          return true
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex)
          return true
        }
        return false
      }
    }))

    return (
      <Command className="max-h-40 overflow-y-auto rounded-md border shadow-md">
        <CommandList ref={scrollContainerRef}>
          {items.length > 0 ? (
            <CommandGroup>
              {items.map((item, index) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => selectItem(index)}
                  data-index={index}
                  className={`cursor-pointer ${
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }`}
                >
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            <CommandEmpty>No snippets found.</CommandEmpty>
          )}
        </CommandList>
      </Command>
    )
  }
)
MentionList.displayName = "MentionList"

// Mention Extension Configuration
export const mentionConfig = {
  suggestion: {
    char: "@",

    // Fetch items based on the query
    items: async ({ query }: { query: string }) => {
      return fetchSnippets(query)
    },

    // Rendering logic
    render: () => {
      let reactRenderer: ReactRenderer
      let popup: Instance<TippyProps>[]

      return {
        onStart: (props: any) => {
          reactRenderer = new ReactRenderer(MentionList, {
            props: {
              items: props.items,
              command: props.command
            },
            editor: props.editor
          })

          if (!props.clientRect) {
            return
          }

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: reactRenderer.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start"
          })
        },

        onUpdate: (props: any) => {
          reactRenderer?.updateProps({
            items: props.items,
            command: props.command
          })

          if (!props.clientRect) {
            return
          }

          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect
          })
        },

        onKeyDown: (props: SuggestionKeyDownProps) => {
          if (props.event.key === "Escape") {
            popup?.[0]?.hide()
            return true
          }

          return reactRenderer?.ref?.onKeyDown(props.event) ?? false
        },

        onExit: () => {
          popup?.[0]?.destroy()
          reactRenderer?.destroy()
        }
      }
    }
  }
}

// Export the configured mention extension
export const configureMention = () => {
  return Mention.configure(mentionConfig)
}
