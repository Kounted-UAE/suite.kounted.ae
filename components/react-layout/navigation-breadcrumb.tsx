'use client'

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { sidebarSections } from "@/lib/config/sidebar-nav"
import { SidebarTrigger } from "./sidebar-trigger"

interface BreadcrumbItem {
  name: string
  href: string
}

export function NavigationBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  
  // Remove 'kounted' from segments since it's our dashboard base
  const dashboardSegments = segments[0] === 'kounted' ? segments.slice(1) : segments

  function getBreadcrumbName(segment: string, fullPath: string): string {
    for (const section of sidebarSections) {
      if (section.items) {
        for (const item of section.items) {
          if (item.url === fullPath) return item.title
        }
      }
    }
    return segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  const breadcrumbs: BreadcrumbItem[] = dashboardSegments.map((segment, idx) => {
    const href = "/" + dashboardSegments.slice(0, idx + 1).join("/")
    return { name: getBreadcrumbName(segment, href), href }
  })

  return (
    <div className="text-lowercase text-xs flex items-center gap-3">
      <nav className="flex items-center gap-2" aria-label="Breadcrumb">
        {breadcrumbs.length === 0 ? (
          <span className="text-black font-semibold">Home</span>
        ) : (
          breadcrumbs.map((crumb, idx) => (
            <span key={crumb.href} className="flex items-center gap-2">
              {idx < breadcrumbs.length - 1 ? (
                <>
                  <Link href={crumb.href} className="text-black hover:underline font-medium">
                    {crumb.name}
                  </Link>
                  <span className="text-black">/</span>
                </>
              ) : (
                <span className="text-green-600 font-semibold">{crumb.name}</span>
              )}
            </span>
          ))
        )}
      </nav>
    </div>
  )
} 