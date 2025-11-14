'use client'

import React from "react"
import { cn } from "@/lib/utils"

export interface FilterBarProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end" | "between"
}

export function FilterBar({ children, className, align = "start" }: FilterBarProps) {
  const alignment = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  }[align]

  return (
    <section
      className={cn(
        "suite-filter-bar flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm",
        alignment,
        className
      )}
    >
      {children}
    </section>
  )
}

