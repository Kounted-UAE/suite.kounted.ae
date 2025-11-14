'use client'

import * as React from "react"

import { useSidebar } from "./sidebar-context"
import { TopNavbar } from "./TopNavbar"
import { AppSidebar } from "./AppSidebar"
import { cn } from "@/lib/utils"

const TOP_NAV_HEIGHT = 72
const SIDEBAR_WIDTH_EXPANDED = 260
const SIDEBAR_WIDTH_COLLAPSED = 80

interface SuiteShellProps {
  children: React.ReactNode
}

export function SuiteShell({ children }: SuiteShellProps) {
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar()

  const sidebarWidth = isMobile
    ? 0
    : state === "collapsed"
    ? SIDEBAR_WIDTH_COLLAPSED
    : SIDEBAR_WIDTH_EXPANDED

  const layoutVars = React.useMemo<React.CSSProperties>(
    () => ({
      ["--suite-top-nav-height" as any]: `${TOP_NAV_HEIGHT}px`,
      ["--suite-sidebar-width" as any]: `${sidebarWidth}px`,
    }),
    [sidebarWidth]
  )

  return (
    <div
      className={cn(
        "suite-shell relative min-h-screen overflow-hidden bg-slate-50 text-slate-900"
      )}
      style={layoutVars}
    >
      <TopNavbar />
      <AppSidebar />

      {isMobile && openMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpenMobile(false)}
        />
      )}

      <main
        className={cn(
          "suite-shell__content relative pt-[var(--suite-top-nav-height)]"
        )}
        style={{
          paddingLeft: `var(--suite-sidebar-width)`,
        }}
      >
        <div
          className={cn(
            "min-h-[calc(100vh-var(--suite-top-nav-height))] w-full px-6 py-6"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
