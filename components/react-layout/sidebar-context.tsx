'use client'

import * as React from "react"
export type SidebarState = "expanded" | "collapsed"

interface SidebarContext {
  state: SidebarState
  isMobile: boolean
  openMobile: boolean
  toggleSidebar: () => void
  setState: (state: SidebarState) => void
  setOpenMobile: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

const COOKIE_KEY = "kounted_suite_sidebar_state"
const MOBILE_BREAKPOINT = 1024 // px, align with Tailwind `lg`

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SidebarState>("expanded")
  const [isMobile, setIsMobile] = React.useState(false)
  const [openMobile, setOpenMobile] = React.useState(false)

  // Hydrate from cookie once on mount
  React.useEffect(() => {
    const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${COOKIE_KEY}=`))
    if (cookie) {
      const value = cookie.split("=")[1] as SidebarState
      if (value === "expanded" || value === "collapsed") {
        setState(value)
      }
    }
  }, [])

  // Track viewport -> mobile/desktop
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const apply = (matches: boolean) => {
      setIsMobile(matches)
      if (!matches) setOpenMobile(false)
    }
    apply(mq.matches)
    const handler = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Persist desktop collapse state
  React.useEffect(() => {
    if (!isMobile) {
      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1)
      document.cookie = `${COOKIE_KEY}=${state}; expires=${expires.toUTCString()}; path=/`
    }
  }, [state, isMobile])

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((v) => !v)
    } else {
      setState((prev) => (prev === "expanded" ? "collapsed" : "expanded"))
    }
  }, [isMobile])

  const value: SidebarContext = {
    state,
    isMobile,
    openMobile,
    toggleSidebar,
    setState,
    setOpenMobile,
  }

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar(): SidebarContext {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return ctx
}