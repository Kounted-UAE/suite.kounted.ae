"use client"

import { Bell, Menu, Settings, LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/react-ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/react-ui/avatar"
import { Button } from "@/components/react-ui/button"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { KountedLogo } from "@/lib/assets/logos/KountedLogo"
import { NavigationBreadcrumb } from "./navigation-breadcrumb"

interface TopNavbarProps {
  className?: string
}

export function TopNavbar({ className }: TopNavbarProps = {}) {
  const { state, isMobile, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <header
      className={cn(
        "suite-topnav fixed inset-x-0 top-0 z-50 flex h-[var(--suite-top-nav-height)] items-center border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur",
        className
      )}
    >
      <div
        className={cn(
          "flex h-full items-center gap-3 px-4",
          "lg:border-r lg:border-slate-200"
        )}
        style={{
          width: isMobile ? "auto" : "var(--suite-sidebar-width)",
        }}
      >
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 focus:outline-none lg:hidden"
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <KountedLogo variant="dark" className="h-7 w-auto" />
      </div>

      <div className="flex flex-1 items-center px-4">
        <NavigationBreadcrumb />
      </div>

      <div className="flex items-center gap-2 px-4">
        <Button variant="ghost" size="icon" className="hidden md:inline-flex">
          <Bell className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/team/ben_jacob.png" alt="User" />
                <AvatarFallback>KC</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline font-medium text-slate-800">Ben Jacobs</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Ben Jacobs</p>
                <p className="text-xs leading-none text-slate-500">kevin@kounted.ae</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
// components/kounted-dashboard/TopNavbar.tsx
