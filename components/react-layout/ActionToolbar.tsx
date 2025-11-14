'use client'

import React from "react"
import { cn } from "@/lib/utils"

export interface ActionToolbarProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end" | "between"
  subdued?: boolean
}

export function ActionToolbar({
  children,
  className,
  align = "between",
  subdued = false,
}: ActionToolbarProps) {
  const alignment = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  }[align]

  return (
    <div
      className={cn(
        "suite-action-toolbar flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 px-4 py-3",
        subdued ? "bg-slate-100/60" : "bg-white shadow-sm",
        alignment,
        className
      )}
    >
      {children}
    </div>
  )
}

