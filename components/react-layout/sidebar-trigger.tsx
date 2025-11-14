'use client'

import * as React from "react"
import { ChevronsLeft, ChevronsRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/react-ui/button"

type SidebarTriggerProps = React.ComponentProps<typeof Button> & {
  collapsed?: boolean
}

export const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  SidebarTriggerProps
>(({ className, collapsed = false, onClick, ...props }, ref) => (
  <Button
    ref={ref}
    data-sidebar="trigger"
    variant="ghost"
    size="icon"
    className={cn("h-9 w-9 text-slate-600 hover:bg-slate-100 hover:text-slate-900", className)}
    onClick={onClick}
    {...props}
  >
    {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
    <span className="sr-only">Toggle Sidebar</span>
  </Button>
))
SidebarTrigger.displayName = "SidebarTrigger"