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
        <div className="flex-1 overflow-auto bg-[#F7F8FC] p-8 pl-12">
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
