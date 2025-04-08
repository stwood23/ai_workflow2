/**
 * @description
 * This module provides utility functions used throughout the application.
 *
 * Key features:
 * - cn: Merges Tailwind CSS classes conditionally and without conflicts.
 *
 * @dependencies
 * - clsx: Library for constructing className strings conditionally.
 * - tailwind-merge: Utility function to merge Tailwind CSS classes without style conflicts.
 *
 * @notes
 * - The `cn` function is commonly used in Shadcn UI components.
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges multiple class names or class name arrays into a single string,
 * resolving Tailwind CSS class conflicts intelligently.
 *
 * @param inputs - A list of class values (strings, arrays, or objects).
 * @returns A string of combined and de-duplicated class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/*
<ai_context>
Contains utility functions for the application.
</ai_context>
*/
