'use client'

import React, { useCallback, useRef, useState, useMemo } from "react"
import { Building, Plus, Users, ChevronDown } from "lucide-react"
import { EmployerManagement } from "@/components/employers"
import { EmployeeManagement, EmployeeImportDialog } from "@/components/employees"
import { Button } from "@/components/react-ui/button"
import { Input } from "@/components/react-ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/react-ui/card"
import { PageHeader } from "@/components/react-layout/PageHeader"
import { FilterBar } from "@/components/react-layout/FilterBar"
import { ActionToolbar } from "@/components/react-layout/ActionToolbar"
import { toast } from "@/hooks/use-toast"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/react-ui/popover"

export default function PayrollProfilesPage() {
  const employerActionsRef = useRef<{ openCreate: () => void } | null>(null)
  const employeeActionsRef = useRef<{ openCreate: () => void } | null>(null)
  const [selectedView, setSelectedView] = useState<"employers" | "employees">("employers")
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Search state with debouncing
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const searchTimeout = useRef<NodeJS.Timeout>()
  
  // Sort state
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  
  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set())
  
  // Debounced search
  const debouncedSetSearch = useCallback((value: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = setTimeout(() => {
      setSearch(value)
    }, 500)
  }, [])
  
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    debouncedSetSearch(value)
  }
  
  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }, [sortBy])
  
  const handleClearSort = useCallback(() => {
    setSortBy('created_at')
    setSortDir('desc')
  }, [])
  
  const handleClearFilters = useCallback(() => {
    setSearchInput('')
    setSearch('')
  }, [])
  
  const handleClearSelections = useCallback(() => {
    setSelected(new Set())
  }, [])

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
  
  // Export to CSV handler
  const handleExportCSV = useCallback(() => {
    // This will be handled by the list components, but we need to pass the handler
    // The actual export logic will be in EmployeeList/EmployerList
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Profiles"
        description={
          <Card className="bg-zinc-100">
            <CardHeader>
              <CardTitle className="text-zinc-900">Usage Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-zinc-800 text-xs">
              <div>
                <h4 className="font-semibold">1. Create Employers First</h4>
                <p className="text-xs">
                  Add company records with reviewer email addresses for payroll notifications.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">2. Add Employees</h4>
                <p className="text-xs">
                  Create employee records and associate them with employers. Include banking details and
                  MOL IDs as needed.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">3. Use Generated UUIDs</h4>
                <p className="text-xs">
                  Copy the generated UUIDs from these records to use in your payroll import files for
                  consistent data linking.
                </p>
              </div>
            </CardContent>
          </Card>
        }
        actions={
          <div className="flex items-center gap-2">
            {selectedView === "employees" && (
              <Button 
                size="sm" 
                variant="ghost"
                className="text-green-700 font-semibold hover:text-green-800"
                onClick={() => setImportDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
            )}
            {selectedView === "employees" ? (
              <Button size="sm" variant="green" onClick={() => employeeActionsRef.current?.openCreate()}>
                Add Employee
              </Button>
            ) : (
              <Button size="sm" variant="green" onClick={() => employerActionsRef.current?.openCreate()}>
                Add Employer
              </Button>
            )}
          </div>
        }
      />

      <FilterBar align="between">
        <div className="flex items-center gap-4 text-slate-600">
          <Input
            type="text"
            placeholder={selectedView === "employees" ? "Search employee, email, employer, MOL ID..." : "Search employer, reviewer email..."}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-sm"
          />
          
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between min-w-[200px] bg-zinc-100">
                {selectedView === "employers" ? "Employers" : "Employees"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 bg-slate-200 text-slate-600">
              <div className="p-1">
                <button
                  onClick={() => {
                    setSelectedView("employers")
                    setPopoverOpen(false)
                    setSelected(new Set())
                    setSearchInput('')
                    setSearch('')
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${
                    selectedView === "employers"
                      ? "bg-slate-700 text-white"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-400"
                  }`}
                >
                  <Building className="h-4 w-4" />
                  Employers
                </button>
                <button
                  onClick={() => {
                    setSelectedView("employees")
                    setPopoverOpen(false)
                    setSelected(new Set())
                    setSearchInput('')
                    setSearch('')
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${
                    selectedView === "employees"
                         ? "bg-slate-700 text-white"
                      : "text-slate-600 hover:bg-slate-200 hover:text-slate-400"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Employees
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Clear Filters */}
          {search && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-600"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </Button>
          )}

          {/* Clear Sort */}
          {(sortBy !== 'created_at' || sortDir !== 'desc') && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-600"
              onClick={handleClearSort}
            >
              Clear Sort
            </Button>
          )}

          {/* Clear Selections */}
          {selected.size > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-600"
              onClick={handleClearSelections}
            >
              Clear All Selections
            </Button>
          )}
        </div>
      </FilterBar>
      
      {selectedView === "employers" ? (
        <EmployerManagement 
          registerActions={registerEmployerActions}
          search={search}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          selected={selected}
          onSelectionChange={setSelected}
        />
      ) : (
        <div key={refreshKey}>
          <EmployeeManagement 
            registerActions={registerEmployeeActions}
            search={search}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            selected={selected}
            onSelectionChange={setSelected}
          />
        </div>
      )}

      <EmployeeImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}

