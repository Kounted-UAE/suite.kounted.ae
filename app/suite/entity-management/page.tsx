'use client'

import React, { useCallback, useRef, useState } from "react"
import { Building, Plus, Users, ChevronDown } from "lucide-react"
import { EmployerManagement } from "@/components/employers"
import { EmployeeManagement, EmployeeImportDialog } from "@/components/employees"
import { Button } from "@/components/react-ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/react-ui/card"
import { PageHeader } from "@/components/react-layout/PageHeader"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/react-ui/popover"

export default function EntityManagementPage() {
  const employerActionsRef = useRef<{ openCreate: () => void } | null>(null)
  const employeeActionsRef = useRef<{ openCreate: () => void } | null>(null)
  const [selectedView, setSelectedView] = useState<"employers" | "employees">("employers")
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const registerEmployerActions = useCallback((actions: { openCreate: () => void }) => {
    employerActionsRef.current = actions
  }, [])

  const registerEmployeeActions = useCallback((actions: { openCreate: () => void }) => {
    employeeActionsRef.current = actions
  }, [])

  const handleImportSuccess = useCallback(() => {
    setImportDialogOpen(false)
    setRefreshKey(prev => prev + 1)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entity Management"
        description="Manage employers and employees for payroll processing. Create and maintain core entity records that generate UUIDs for use in payroll transactions."
        breadcrumbs="Payroll Deck"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between min-w-[200px] bg-zinc-100">
              {selectedView === "employers" ? "Employers" : "Employees"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0 bg-slate-800 text-white">
            <div className="p-1">
              <button
                onClick={() => {
                  setSelectedView("employers")
                  setPopoverOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedView === "employers"
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Building className="h-4 w-4" />
                Employers
              </button>
              <button
                onClick={() => {
                  setSelectedView("employees")
                  setPopoverOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedView === "employees"
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Users className="h-4 w-4" />
                Employees
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {selectedView === "employees" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setImportDialogOpen(true)}
              className="text-green-700 font-semibold text-sm hover:text-green-800 transition-colors"
            >
              Import
            </button>
            <Button size="sm" variant="green" onClick={() => employeeActionsRef.current?.openCreate()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="green" onClick={() => employerActionsRef.current?.openCreate()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employer
          </Button>
        )}
      </div>

      {selectedView === "employers" ? (
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-base text-slate-600">
              <Building className="h-4 w-4" />
              Employer Records
            </CardTitle>
            <p className="text-sm text-slate-500">
              Manage company records. Each employer has a unique UUID that can be used in payroll
              imports to maintain data consistency.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <EmployerManagement registerActions={registerEmployerActions} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-base text-slate-600">
              <Users className="h-4 w-4" />
              Employee Records
            </CardTitle>
            <p className="text-sm text-slate-500">
              Manage employee records linked to employers. Each employee has a unique UUID that can
              be used in payroll imports to ensure proper identification.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div key={refreshKey}>
              <EmployeeManagement registerActions={registerEmployeeActions} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-800">
          <div>
            <h4 className="font-semibold">1. Create Employers First</h4>
            <p className="text-sm">
              Add company records with reviewer email addresses for payroll notifications.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">2. Add Employees</h4>
            <p className="text-sm">
              Create employee records and associate them with employers. Include banking details and
              MOL IDs as needed.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">3. Use Generated UUIDs</h4>
            <p className="text-sm">
              Copy the generated UUIDs from these records to use in your payroll import files for
              consistent data linking.
            </p>
          </div>
        </CardContent>
      </Card>

      <EmployeeImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}
