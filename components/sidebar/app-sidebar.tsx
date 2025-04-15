/*
<ai_context>
This client component provides the sidebar for the app.
</ai_context>
*/

"use client"

import { Database, FileText, Settings2, Workflow } from "lucide-react"
import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar"
import { NavUser } from "./nav-user"
import { UserButton } from "@clerk/nextjs"
import type { LucideIcon } from "lucide-react"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      title: "Prompts",
      url: "/prompts",
      icon: FileText,
      isActive: pathname.startsWith("/prompts")
    },
    {
      title: "Documents",
      url: "/documents",
      icon: FileText,
      isActive: pathname.startsWith("/documents")
    },
    {
      title: "Context",
      url: "/context",
      icon: Database,
      isActive: pathname.startsWith("/context")
    },
    {
      title: "Workflows",
      url: "/workflows",
      icon: Workflow,
      isActive: pathname.startsWith("/workflows")
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      isActive: pathname.startsWith("/settings")
    }
  ]

  return (
    <Sidebar collapsible="icon" className="bg-white" {...props}>
      <SidebarHeader>
        <div className="p-4 text-lg font-semibold">AI Flow</div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col p-2">
        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.isActive
                  ? "bg-gradient-to-r from-[#22965A] to-[#2AB090] text-white"
                  : "text-muted-foreground-darker hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
