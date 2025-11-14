'use client'

import React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  breadcrumbs?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "suite-page-header relative flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      {breadcrumbs ? (
        <div className="text-xs font-medium uppercase tracking-widest text-slate-400">
          {breadcrumbs}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      {children ? <div className="suite-page-header__extra">{children}</div> : null}
    </header>
  )
}

