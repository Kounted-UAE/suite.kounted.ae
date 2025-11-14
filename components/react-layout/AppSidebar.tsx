'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { ScrollArea } from "@/components/react-ui/scroll-area"
import { sidebarSections } from "@/lib/config/sidebar-nav"
import { Badge } from "@/components/react-ui/badge"
import { SidebarTrigger } from "./sidebar-trigger"

const SIDEBAR_WIDTH_EXPANDED = 260
const SIDEBAR_WIDTH_COLLAPSED = 80

type AppSidebarProps = {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps = {}) {
  const pathname = usePathname()
  const { state, isMobile, openMobile, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})

  const isActive = (path: string) => pathname === path
  const getNavCls = (path: string, collapsedView: boolean) =>
    isActive(path)
      ? "text-slate-900 bg-slate-100 font-semibold"
      : collapsedView
      ? "text-slate-600 hover:text-slate-900"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"

  const toggleSection = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))

  const renderSections = (collapsedView: boolean) => (
    <div className="px-2 py-3">
      {sidebarSections.map((section) => (
        <div key={section.label} className="mb-4">
          {!collapsedView && (
            <div className="flex items-center justify-between border-b border-slate-200 px-2 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.label}
              </div>
              {section.collapsible !== true && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  className="inline-flex h-auto items-center rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <ChevronDown
                    className={clsx(
                      "h-2 w-2 transition-transform",
                      expanded[section.label] !== false ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </button>
              )}
            </div>
          )}
          {(section.collapsible === false || expanded[section.label] !== false || collapsedView) && (
            <div>
              {section.items && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const status = item.status || "active"
                    const isInactive = status === "locked" || status === "wip"
                    return (
                      <div key={item.title}>
                        {isInactive ? (
                          <div
                            className={clsx(
                              "flex items-center py-2 text-slate-300",
                              collapsedView ? "justify-center px-0" : "mx-1 gap-2 px-2"
                            )}
                          >
                            {item.icon && <item.icon className="h-4 w-4" />}
                            {!collapsedView && <span className="text-xs">{item.title}</span>}
                            {!collapsedView && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {status === "locked" ? "🔒" : "🛡️"}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={item.url || "#"}
                            className={clsx(
                              "flex items-center rounded-md py-2 transition-colors",
                              collapsedView ? "justify-center px-0" : "mx-1 gap-2 px-2",
                              getNavCls(item.url || "", collapsedView)
                            )}
                          >
                            {item.icon && <item.icon className="h-4 w-4" />}
                            {!collapsedView && <span className="text-xs">{item.title}</span>}
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const desktopWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED

  const desktopSidebar = (
    <aside
      className={cn(
        "suite-sidebar fixed top-[var(--suite-top-nav-height)] z-40 hidden h-[calc(100vh-var(--suite-top-nav-height))] flex-col border-r border-slate-200 bg-white shadow-md transition-[width] duration-300 lg:flex",
        className
      )}
      style={{ width: `${desktopWidth}px` }}
    >
      <ScrollArea className="flex-1">{renderSections(collapsed)}</ScrollArea>
      <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3">
        {!collapsed && (
          <div className="text-[10px] uppercase tracking-widest text-slate-400">v2.0.0</div>
        )}
        <SidebarTrigger collapsed={collapsed} onClick={toggleSidebar} />
      </div>
    </aside>
  )

  const mobileSidebar = (
    <aside
      className={cn(
        "suite-sidebar fixed left-0 top-[var(--suite-top-nav-height)] z-40 h-[calc(100vh-var(--suite-top-nav-height))] w-64 transform bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden",
        openMobile ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <ScrollArea className="flex-1">{renderSections(false)}</ScrollArea>
      <div className="border-t border-slate-200 px-3 py-3">
        <SidebarTrigger collapsed={false} onClick={toggleSidebar} />
      </div>
    </aside>
  )

  return (
    <>
      {desktopSidebar}
      {isMobile ? mobileSidebar : null}
    </>
  )
}
