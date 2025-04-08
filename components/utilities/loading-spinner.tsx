/**
 * @description
 * This component renders a simple loading spinner icon.
 * It uses the Loader2 icon from lucide-react and applies a spinning animation.
 *
 * Key features:
 * - Displays an animated loading indicator.
 * - Allows customization of size, color, etc., via className.
 *
 * @dependencies
 * - react: Core library for component creation.
 * - lucide-react: Provides the Loader2 icon.
 * - @/lib/utils: Provides the 'cn' utility for merging class names.
 *
 * @props
 * - className?: string - Optional Tailwind CSS classes to modify the spinner's appearance (e.g., 'h-8 w-8 text-primary').
 *
 * @notes
 * - This is a server component.
 * - The animation is achieved using the Tailwind 'animate-spin' utility.
 */
"use server"

import React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
}

export default function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return <Loader2 className={cn("animate-spin", className)} />
}
