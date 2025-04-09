/**
 * @description
 * This component displays a consistent page header section.
 * It includes a main title, an optional description, and an optional slot for action buttons.
 *
 * Key features:
 * - Displays a primary page title.
 * - Optionally displays a description below the title.
 * - Optionally renders action elements (like buttons) passed as children.
 *
 * @dependencies
 * - react: Core library for component creation.
 *
 * @props
 * - title: string - The main heading text.
 * - description?: string - Optional text displayed below the title.
 * - actions?: React.ReactNode - Optional React nodes (e.g., buttons) to render on the right side.
 *
 * @notes
 * - This is a server component.
 * - Styling is done using Tailwind CSS utility classes.
 * - Uses semantic HTML elements (h1, p).
 * - Marked async to comply with Next.js requirements for default exported server components.
 */
"use server"

import React from "react"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

// Needs to be async even if no await is used inside
export default async function PageHeader({
  title,
  description,
  actions
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between space-y-2 py-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>

      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
  )
}
