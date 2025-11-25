'use client'

import React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "suite-page-header relative flex flex-col gap-4 rounded-2xl backdrop-blur-sm",
        className
      )}
    >
      {title ? (
        <div className="text-xs font-medium uppercase tracking-widest text-slate-400">
          {title}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          {description ? (
            <p className="max-w-2xl text-xs text-black font-medium">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      {children ? <div className="suite-page-header__extra">{children}</div> : null}
    </header>
  )
}

