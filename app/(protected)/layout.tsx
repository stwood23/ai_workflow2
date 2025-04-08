/**
 * @description
 * This layout serves as the main structure for authenticated sections of the application.
 * It renders the application sidebar alongside the main content area for protected routes.
 *
 * @dependencies
 * - AppSidebar: The main navigation sidebar component.
 * - React: Used for component structure.
 *
 * @notes
 * - This is a Server Component.
 * - It assumes Clerk middleware protects routes within this layout group.
 */
"use server"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import * as React from "react"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default async function ProtectedLayout({
  children
}: ProtectedLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full flex-row overflow-hidden">
        <AppSidebar />
        <main className="bg-background flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
