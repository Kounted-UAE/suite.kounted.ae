// DashboardLayout.tsx
'use client'

import React from "react"
import { SuiteShell } from "./SuiteShell"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SuiteShell>{children}</SuiteShell>
}
