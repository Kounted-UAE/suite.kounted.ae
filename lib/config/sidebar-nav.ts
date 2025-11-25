// lib/config/sidebar-nav.ts

import {
    Users, FileText, ShoppingCart, CheckSquare, Settings, PanelTopInactiveIcon, PieChart, 
     Calendar, DollarSign, Building, Receipt, BarChart3, BarChart2 , RocketIcon,
    BookOpen, FolderOpen, Link as LinkIcon, LayoutTemplate, Briefcase, FileSpreadsheet, GitBranch, FolderKanban, Archive, Database, HardDrive
  } from "lucide-react"

export interface SidebarItem {
  title: string
  url: string
  icon: any
  status?: "active" | "wip" | "locked"
}

export interface SidebarSection {
  label: string
  items: SidebarItem[]
  collapsible?: boolean
}
  
export const sidebarSections: SidebarSection[] = [
  {
    label: "Payroll Deck",
    items: [
      { title: "Payroll Payslips", url: "/suite/payroll", icon: FileSpreadsheet, status: "active" },
      { title: "Payroll Profiles", url: "/suite/payroll-profiles", icon: Users, status: "active" },
     
    ],
    collapsible: false,
  },
  {
    label: "Client Deck",
    items: [
      { title: "Teamwork Projects", url: "/suite/teamwork-projects", icon: FolderKanban, status: "active" },
    ],
    collapsible: false,
  },
  {
    label: "Admin Deck",
    items: [
      { title: "User Manager", url: "/suite/admin/users", icon: Users, status: "active" },
      { title: "File Manager", url: "/suite/admin/storage", icon: Archive, status: "active" },
      { title: "Payroll Manager", url: "/suite/admin/pay-period-management", icon: FolderKanban, status: "active" },       
    ],
    collapsible: false,
  },
]
  