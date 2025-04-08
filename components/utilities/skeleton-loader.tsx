/**
 * @description
 * This component provides a simple wrapper around the Shadcn Skeleton component.
 * It's intended for use as a fallback in React Suspense boundaries to show a standardized placeholder.
 *
 * Key features:
 * - Renders the Shadcn Skeleton component.
 * - Allows easy application of custom dimensions and styles via className.
 *
 * @dependencies
 * - react: Core library for component creation.
 * - @/components/ui/skeleton: The underlying Shadcn Skeleton component.
 * - @/lib/utils: Provides the 'cn' utility for merging class names.
 *
 * @props
 * - className?: string - Optional Tailwind CSS classes to define the skeleton's appearance (e.g., height, width, rounded corners).
 *
 * @notes
 * - This is a server component.
 * - Pass Tailwind classes like 'h-12 w-full rounded-md' via the className prop to shape the skeleton.
 */
"use server"

import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface SkeletonLoaderProps {
  className?: string
}

export default function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return <Skeleton className={cn(className)} />
}
