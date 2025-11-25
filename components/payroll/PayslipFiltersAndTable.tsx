'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Button } from '@/components/react-ui/button'
import { Checkbox } from '@/components/react-ui/checkbox'
import { Input } from '@/components/react-ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/react-ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/react-ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/react-ui/command'
import { Badge } from '@/components/react-ui/badge'
import { ChevronDown, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { toast } from '@/hooks/use-toast'
import * as XLSX from 'xlsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/react-ui/select'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from '@/components/react-ui/pagination'
import { generatePayslipFilename, extractTokenFromFilename } from '@/lib/utils/pdf/payslipNaming'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/react-ui/alert-dialog'
import { ToastAction } from '@/components/react-ui/toast'

const SUPABASE_PUBLIC_URL = 'https://tyznabdlwpgldgxktlzo.supabase.co/storage/v1/object/public/Payroll'

export type PayslipRow = {
  batch_id: string
  employee_id: string
  employer_id: string
  employee_name: string
  employer_name: string
  reviewer_email: string
  email_id: string
  net_salary: number
  currency: string
  payslip_url: string
  payslip_token: string
  created_at: string
  pay_period_to: string | null
  last_sent_at?: string | null
  delivery_status?: string | null
  delivery_status_updated_at?: string | null
  resend_email_id?: string | null
}

interface PayslipFiltersAndTableProps {
  rows: PayslipRow[]
  selected: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onProceedToEmail: () => void
  onProceedToGenerate?: () => void
  onFilteredRowsChange?: (filteredRows: PayslipRow[]) => void
  onPayrunSuccess?: () => void
  total?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (field: string) => void
  onClearSort?: () => void
  // Filter props
  search?: string
  onSearchChange?: (search: string) => void
  selectedEmployers?: Set<string>
  onEmployersChange?: (employers: Set<string>) => void
  selectedDates?: Set<string>
  onDatesChange?: (dates: Set<string>) => void
  onFiltersChange?: () => void
  showDeleted?: boolean
}

export function PayslipFiltersAndTable({
  rows,
  selected,
  onSelectionChange,
  onProceedToEmail,
  onProceedToGenerate,
  onFilteredRowsChange,
  onPayrunSuccess,
  total = 0,
  page = 1,
  pageSize = 200,
  onPageChange,
  sortBy = 'created_at',
  sortDir = 'desc',
  onSort,
  onClearSort,
  // Filter props
  search = '',
  onSearchChange,
  selectedEmployers = new Set(),
  onEmployersChange,
  selectedDates = new Set(),
  onDatesChange,
  onFiltersChange,
  showDeleted = false,
}: PayslipFiltersAndTableProps) {
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null)
  const [uniqueEmployers, setUniqueEmployers] = useState<string[]>([])
  const [uniqueDates, setUniqueDates] = useState<string[]>([])
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([])

  // Export selected rows to Excel (XLSX) with complete payroll data matching CSV structure
  const handleExportSelected = () => {
    const selectedRows = rows.filter(r => selected.has(r.batch_id))
    if (selectedRows.length === 0) {
      toast({ title: 'No selection', description: 'Please select payslips to export', variant: 'destructive' })
      return
    }
    
    try {
      // Column order matching the payroll_excel_imports_rows.csv structure
      const data = selectedRows.map((r: any) => ({
        employee_id: r.employee_id || '',
        employer_id: r.employer_id || '',
        employer_name: r.employer_name || '',
        reviewer_email: r.reviewer_email || '',
        employee_name: r.employee_name || '',
        email_id: r.email_id || '',
        employee_mol: r.employee_mol || '',
        bank_name: r.bank_name || '',
        iban: r.iban || '',
        pay_period_from: r.pay_period_from || '',
        pay_period_to: r.pay_period_to || '',
        leave_without_pay_days: r.leave_without_pay_days ?? 0,
        currency: r.currency || 'AED',
        basic_salary: r.basic_salary ?? '',
        housing_allowance: r.housing_allowance ?? '',
        education_allowance: r.education_allowance ?? '',
        flight_allowance: r.flight_allowance ?? '',
        general_allowance: r.general_allowance ?? '',
        gratuity_eosb: r.gratuity_eosb ?? '',
        other_allowance: r.other_allowance ?? '',
        transport_allowance: r.transport_allowance ?? '',
        total_gross_salary: r.total_gross_salary ?? '',
        bonus: r.bonus ?? '',
        overtime: r.overtime ?? '',
        salary_in_arrears: r.salary_in_arrears ?? '',
        unutilised_leave_days_payment: r.unutilised_leave_days_payment ?? '',
        expenses_deductions: r.expenses_deductions ?? '',
        other_reimbursements: r.other_reimbursements ?? '',
        expense_reimbursements: r.expense_reimbursements ?? '',
        total_adjustments: r.total_adjustments ?? '',
        net_salary: r.net_salary ?? '',
        esop_deductions: r.esop_deductions ?? '',
        total_payment_adjustments: r.total_payment_adjustments ?? '',
        net_payment: r.net_payment ?? '',
      }))

      // Generate CSV content
      const headers = [
        'employee_id', 'employer_id', 'employer_name', 'reviewer_email', 'employee_name', 
        'email_id', 'employee_mol', 'bank_name', 'iban', 'pay_period_from', 'pay_period_to',
        'leave_without_pay_days', 'currency', 'basic_salary', 'housing_allowance', 
        'education_allowance', 'flight_allowance', 'general_allowance', 'gratuity_eosb',
        'other_allowance', 'transport_allowance', 'total_gross_salary', 'bonus', 'overtime',
        'salary_in_arrears', 'unutilised_leave_days_payment', 'expenses_deductions', 'other_reimbursements', 'expense_reimbursements',
        'total_adjustments', 'net_salary', 'esop_deductions', 'total_payment_adjustments', 'net_payment'
      ]
      
      // Convert data to CSV format
      const csvRows = [headers.join(',')]
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header as keyof typeof row] || ''
          // Escape commas and quotes in CSV values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        csvRows.push(values.join(','))
      })
      
      const csvContent = csvRows.join('\n')
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `selected-payslips-${timestamp}.csv`
      
      // Create download link
      const link = document.createElement('a')
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      toast({ 
        title: 'Export successful', 
        description: `Exported ${selectedRows.length} payslips to ${filename}`,
        variant: 'default'
      })
    } catch (e: any) {
      console.error('CSV export error:', e)
      toast({ 
        title: 'Export failed', 
        description: e?.message || 'Unknown error occurred during export', 
        variant: 'destructive' 
      })
    }
  }

  // Handle delete confirmation dialog
  const handleDeleteClick = () => {
    const ids = rows.filter(r => selected.has(r.batch_id)).map(r => r.batch_id)
    if (ids.length === 0) return
    setPendingDeleteIds(ids)
    setShowDeleteDialog(true)
  }

  // Delete selected rows (called after confirmation)
  const handleDeleteConfirmed = async () => {
    const ids = pendingDeleteIds
    if (ids.length === 0) {
      setShowDeleteDialog(false)
      return
    }
    
    setShowDeleteDialog(false)
    
    try {
      const res = await fetch('/api/admin/payslips/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg)
      }
      
      // Show toast with undo button
      toast({
        title: 'Deleted',
        description: `Removed ${ids.length} record${ids.length !== 1 ? 's' : ''}.`,
        action: (
          <ToastAction altText="Undo" onClick={() => handleRestoreDeleted(ids)}>
            Undo
          </ToastAction>
        ),
      })
      
      onSelectionChange(new Set())
      onPayrunSuccess?.()
      setPendingDeleteIds([])
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Unknown error', variant: 'destructive' })
      setPendingDeleteIds([])
    }
  }

  // Restore deleted rows (from toast undo or button)
  const handleRestoreDeleted = async (ids: string[]) => {
    if (ids.length === 0) return
    
    try {
      const res = await fetch('/api/admin/payslips/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg)
      }
      
      toast({ 
        title: 'Restored', 
        description: `Restored ${ids.length} record${ids.length !== 1 ? 's' : ''}.` 
      })
      
      onSelectionChange(new Set())
      onPayrunSuccess?.()
    } catch (e: any) {
      toast({ 
        title: 'Restore failed', 
        description: e?.message || 'Unknown error', 
        variant: 'destructive' 
      })
    }
  }

  // Restore selected rows (from restore button)
  const handleRestoreSelected = async () => {
    const ids = rows.filter(r => selected.has(r.batch_id)).map(r => r.batch_id)
    if (ids.length === 0) return
    await handleRestoreDeleted(ids)
  }

  // Permanently delete selected rows (hard delete from database)
  const handlePermanentDelete = async () => {
    const ids = rows.filter(r => selected.has(r.batch_id)).map(r => r.batch_id)
    if (ids.length === 0) return
    
    // Confirm permanent deletion
    const confirmMessage = `Are you sure you want to permanently delete ${ids.length} record${ids.length !== 1 ? 's' : ''}? This action CANNOT be undone.`
    if (!confirm(confirmMessage)) {
      return
    }
    
    try {
      const res = await fetch('/api/admin/payslips/delete-permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg)
      }
      
      toast({ 
        title: 'Permanently deleted', 
        description: `Permanently removed ${ids.length} record${ids.length !== 1 ? 's' : ''} from the database.` 
      })
      
      onSelectionChange(new Set())
      onPayrunSuccess?.()
    } catch (e: any) {
      toast({ 
        title: 'Permanent delete failed', 
        description: e?.message || 'Unknown error', 
        variant: 'destructive' 
      })
    }
  }

  const downloadZip = async () => {
    const zip = new JSZip()
    const selectedRows = rows.filter(r => selected.has(r.batch_id))
    
    setDownloadProgress({ current: 0, total: selectedRows.length })

    for (let i = 0; i < selectedRows.length; i++) {
      const row = selectedRows[i]
      setDownloadProgress({ current: i, total: selectedRows.length })
      
      if (!row.payslip_token) continue
      const filename = generatePayslipFilename(row.employee_name || 'unknown', row.payslip_token)
      const fileUrl = row.payslip_url && row.payslip_url.startsWith('http')
        ? row.payslip_url
        : `${SUPABASE_PUBLIC_URL}/${filename}`
      
      try {
        const res = await fetch(fileUrl)
        if (!res.ok) {
          console.error(`Failed to fetch ${filename}:`, res.statusText)
          continue
        }
        const blob = await res.blob()
        // Use the nice filename even if legacy URL was used to fetch
        zip.file(filename, blob)
      } catch (error) {
        console.error(`Error downloading ${filename}:`, error)
      }
    }

    setDownloadProgress({ current: selectedRows.length, total: selectedRows.length })
    
    toast({ title: 'Creating ZIP file...', description: 'Please wait while we compress the files' })
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    saveAs(zipBlob, 'selected-payslips.zip')
    
    setDownloadProgress(null)
    toast({ title: 'Download complete', description: `Downloaded ${selectedRows.length} payslips` })
  }

  // Fetch unique values for filters from the database with contextual filtering
  const fetchFilterOptions = useCallback(async () => {
    try {
      setLoadingFilters(true)
      
      // Base params for search filter
      const baseParams = new URLSearchParams()
      if (search.trim()) {
        baseParams.set('search', search.trim())
      }
      
      // For employers: apply current date and search filters (exclude employer filter)
      const employerParams = new URLSearchParams(baseParams)
      if (selectedDates.size > 0) {
        employerParams.set('dates', Array.from(selectedDates).join(','))
      }
      employerParams.set('limit', '1000')
      
      // For dates: apply current employer and search filters (exclude date filter)
      const datesParams = new URLSearchParams(baseParams)
      if (selectedEmployers.size > 0) {
        datesParams.set('employers', Array.from(selectedEmployers).join(','))
      }
      datesParams.set('limit', '1000')
      
      const [employersRes, datesRes] = await Promise.all([
        fetch(`/api/admin/payslips/list?${employerParams.toString()}`),
        fetch(`/api/admin/payslips/list?${datesParams.toString()}`)
      ])

      if (employersRes.ok && datesRes.ok) {
        const [employersData, datesData] = await Promise.all([
          employersRes.json(),
          datesRes.json()
        ])
        
        const employersSet = new Set<string>()
        const datesSet = new Set<string>()
        
        employersData.rows?.forEach((row: any) => {
          if (row.employer_name) employersSet.add(row.employer_name)
        })
        
        datesData.rows?.forEach((row: any) => {
          if (row.pay_period_to) datesSet.add(row.pay_period_to)
        })
        
        setUniqueEmployers(Array.from(employersSet).sort())
        setUniqueDates(Array.from(datesSet).sort((a, b) => b.localeCompare(a))) // Newest first
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    } finally {
      setLoadingFilters(false)
    }
  }, [search, selectedEmployers, selectedDates])

  // Fetch filter options on mount and when search or filter selections change
  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  // Use rows directly since filtering is now server-side
  const filtered = rows
  const selectedInFiltered = useMemo(() => {
    return filtered.filter(r => selected.has(r.batch_id)).length
  }, [filtered, selected])

  // Notify parent of filtered rows changes
  useEffect(() => {
    onFilteredRowsChange?.(filtered)
  }, [filtered, onFilteredRowsChange])

  const toggleSelection = (batchId: string) => {
    const next = new Set(selected)
    next.has(batchId) ? next.delete(batchId) : next.add(batchId)
    onSelectionChange(next)
  }

  // Helper function to check if ZIP download should be enabled
  const isZipDownloadEnabled = () => {
    if (selected.size === 0) return false
    const selectedRows = rows.filter(r => selected.has(r.batch_id))
    return selectedRows.some(r => r.payslip_token)
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  const HeaderButton = ({ field, label }: { field: string; label: string }) => (
    <button
      className="inline-flex items-center gap-1 hover:underline"
      onClick={() => onSort?.(field)}
      type="button"
    >
      <span>{label}</span>
      <SortIcon field={field} />
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap text-slate-600">
          <Input
            type="text"
            placeholder="Search employee, employer, or email..."
            value={search}
            onChange={(e) => {
              onSearchChange?.(e.target.value)
              onFiltersChange?.()
            }}
            className="w-full max-w-sm"
          />
          
          {/* Employer Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between min-w-[200px] bg-zinc-100">
                {selectedEmployers.size === 0 
                  ? "All Employers" 
                  : `${selectedEmployers.size} employer${selectedEmployers.size !== 1 ? 's' : ''}`
                }
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-slate-800 text-white">
              <Command>
                <CommandInput placeholder="Search employers..." />
                <CommandList>
                  {loadingFilters ? (
                    <div className="p-4 text-center text-sm text-gray-400">Loading employers...</div>
                  ) : (
                    <>
                      <CommandEmpty>No employers found.</CommandEmpty>
                      <CommandGroup>
                        {uniqueEmployers.map((employer) => (
                      <CommandItem
                        key={employer}
                        onSelect={() => {
                          const next = new Set(selectedEmployers)
                          if (next.has(employer)) {
                            next.delete(employer)
                          } else {
                            next.add(employer)
                          }
                          onEmployersChange?.(next)
                          onFiltersChange?.()
                        }}
                      >
                        <Checkbox
                          checked={selectedEmployers.has(employer)}
                          className="mr-2"
                        />
                          {employer}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
          </Popover>

          {/* Date Filter */}
          <Popover >
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between min-w-[200px] bg-zinc-100">
                {selectedDates.size === 0 
                  ? "All Dates" 
                  : `${selectedDates.size} date${selectedDates.size !== 1 ? 's' : ''}`
                }
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-slate-800 text-white">
              <Command>
                <CommandInput placeholder="Search dates..." />
                <CommandList>
                  {loadingFilters ? (
                    <div className="p-4 text-center text-sm text-gray-400">Loading dates...</div>
                  ) : (
                    <>
                      <CommandEmpty>No dates found.</CommandEmpty>
                      <CommandGroup>
                        {uniqueDates.map((date) => (
                      <CommandItem
                        key={date}
                        onSelect={() => {
                          const next = new Set(selectedDates)
                          if (next.has(date)) {
                            next.delete(date)
                          } else {
                            next.add(date)
                          }
                          onDatesChange?.(next)
                          onFiltersChange?.()
                        }}
                      >
                        <Checkbox
                          checked={selectedDates.has(date)}
                          className="mr-2"
                        />
                          {date}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {(search || selectedEmployers.size > 0 || selectedDates.size > 0) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-600"
              onClick={() => {
                onSearchChange?.('')
                onEmployersChange?.(new Set())
                onDatesChange?.(new Set())
                onFiltersChange?.()
              }}
            >
              Clear All Filters
            </Button>
          )}

          {onClearSort && (sortBy !== 'created_at' || sortDir !== 'desc') && (
            <Button variant="ghost" size="sm" className="text-green-600" onClick={onClearSort}>Clear Sort</Button>
          )}

          {selected.size > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-600"
              onClick={() => onSelectionChange(new Set())}
            >
              Clear All Selections
            </Button>
          )}
        </div>

        {/* Active Filter Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from(selectedEmployers).map((employer) => (
            <Badge key={employer} variant="secondary" className="gap-1 text-green-600">
              {employer}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  const next = new Set(selectedEmployers)
                  next.delete(employer)
                  onEmployersChange?.(next)
                  onFiltersChange?.()
                }}
              />
            </Badge>
          ))}
          {Array.from(selectedDates).map((date) => (
            <Badge key={date} variant="secondary" className="gap-1 text-green-600">
              {date}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  const next = new Set(selectedDates)
                  next.delete(date)
                  onDatesChange?.(next)
                  onFiltersChange?.()
                }}
              />
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-green-600">
            Showing {rows.length} result{rows.length !== 1 && 's'} of {total} records
            {selectedInFiltered > 0 && (
              <span className="ml-2">
                • {selectedInFiltered} selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Download Progress */}
      {downloadProgress && (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">
              Downloading payslips... {downloadProgress.current} / {downloadProgress.total}
            </span>
            <span className="text-sm text-purple-700">
              {Math.round((downloadProgress.current / downloadProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons Section */}
      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={downloadZip}
            disabled={!isZipDownloadEnabled() || !!downloadProgress}
          >
            {downloadProgress ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              'Download Selected (ZIP)'
            )}
          </Button>
          <Button
            variant="default"
            onClick={handleExportSelected}
            disabled={!selected.size}
          >
            Export Selected (CSV)
          </Button>
          <Button
            variant="default"
            onClick={() => onProceedToGenerate?.()}
            disabled={!selected.size}
          >
            Generate Selected Payslips
          </Button>
          <Button
            onClick={onProceedToEmail}
            disabled={!selected.size}
            variant="default"
          >
            Send to Email
          </Button>
          {!showDeleted ? (
            <Button
              variant="default"
              onClick={handleDeleteClick}
              disabled={!selected.size}
            >
              Delete Selected
            </Button>
          ) : (
            <>
              <Button
                variant="default"
                onClick={handleRestoreSelected}
                disabled={!selected.size}
              >
                Restore Selected
              </Button>
              <Button
                variant="destructive"
                onClick={handlePermanentDelete}
                disabled={!selected.size}
              >
                Delete Permanently
              </Button>
            </>
          )}
        </div>
      </div>
      {/* Table Section */}
      <Table>
        <TableHeader className="bg-slate-800 text-white">
          <TableRow>
            <TableHead >
              <Checkbox
                checked={filtered.length > 0 && filtered.every(r => selected.has(r.batch_id))}
                indeterminate={
                  filtered.some(r => selected.has(r.batch_id)) &&
                  !filtered.every(r => selected.has(r.batch_id))
                }
                onCheckedChange={(checked) => {
                  const next = new Set(selected)
                  filtered.forEach(row => {
                    if (checked) {
                      next.add(row.batch_id)
                    } else {
                      next.delete(row.batch_id)
                    }
                  })
                  onSelectionChange(next)
                }}
              />
            </TableHead >
            <TableHead><HeaderButton field="pay_period_to" label="Date" /></TableHead>
            <TableHead><HeaderButton field="employee_name" label="Employee" /></TableHead>
            <TableHead>Payslip</TableHead>
            <TableHead><HeaderButton field="employer_name" label="Employer" /></TableHead>
            <TableHead><HeaderButton field="email_id" label="Email" /></TableHead>
            <TableHead><HeaderButton field="currency" label="Currency" /></TableHead>
            <TableHead><HeaderButton field="net_salary" label="Net Salary" /></TableHead>
            <TableHead><HeaderButton field="net_payment" label="Net Payment" /></TableHead>
            <TableHead>Last Sent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(row => (
            <TableRow key={row.batch_id}>
              <TableCell>
                <Checkbox
                  checked={selected.has(row.batch_id)}
                  onCheckedChange={() => toggleSelection(row.batch_id)}
                />
              </TableCell>
              <TableCell>{row.pay_period_to || 'N/A'}</TableCell>
              <TableCell>{row.employee_name}</TableCell>
              <TableCell>
                {row.payslip_token ? (
                  <a
                    href={row.payslip_url && row.payslip_url.startsWith('http')
                      ? row.payslip_url
                      : `${SUPABASE_PUBLIC_URL}/${generatePayslipFilename(row.employee_name || 'unknown', row.payslip_token)}`}
                    target="_blank"
                    className="text-zinc-600 underline text-xs"
                  >
                    View PDF
                  </a>
                ) : (
                  <span className="text-cyan-600 text-xs">Not available</span>
                )}
              </TableCell>
              <TableCell>{row.employer_name}</TableCell>
              <TableCell>{row.email_id}</TableCell>
              <TableCell>{row.currency}</TableCell>
              <TableCell>{(row as any).net_salary}</TableCell>
              <TableCell>{(row as any).net_payment ?? (row as any).net_salary ?? '-'}</TableCell>
              <TableCell>
                {(() => {
                  // Use delivery_status_updated_at if available, otherwise use last_sent_at
                  const statusTimestamp = row.delivery_status_updated_at || row.last_sent_at
                  const deliveryStatus = row.delivery_status
                  
                  if (!statusTimestamp) {
                    return <span className="text-cyan-600 text-xs">Never</span>
                  }
                  
                  // Format timestamp
                  const date = new Date(statusTimestamp)
                  const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                  const formattedTime = date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                  
                  // Determine status badge color and text
                  let statusBadge: { text: string; className: string } | null = null
                  if (deliveryStatus === 'delivered') {
                    statusBadge = { text: 'Delivered', className: 'bg-green-100 text-green-800 border-green-200' }
                  } else if (deliveryStatus === 'sent') {
                    statusBadge = { text: 'Sent', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
                  } else if (deliveryStatus === 'failed' || deliveryStatus === 'bounced' || deliveryStatus === 'complained') {
                    statusBadge = { text: 'Failed', className: 'bg-red-100 text-red-800 border-red-200' }
                  } else if (deliveryStatus) {
                    // Other statuses like 'opened', 'clicked', etc.
                    statusBadge = { text: deliveryStatus.charAt(0).toUpperCase() + deliveryStatus.slice(1), className: 'bg-blue-100 text-blue-800 border-blue-200' }
                  }
                  
                  return (
                    <div className="flex flex-col gap-1">
                      {statusBadge && (
                        <Badge variant="outline" className={`text-xs ${statusBadge.className}`}>
                          {statusBadge.text}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-600">
                        {statusBadge ? `${statusBadge.text} ${formattedDate}, ${formattedTime}` : `${formattedDate}, ${formattedTime}`}
                      </span>
                    </div>
                  )
                })()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Footer with pagination */}
      <div className="flex items-center justify-between mt-2">

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={(e) => { e.preventDefault(); onPageChange?.(Math.max(1, page - 1)) }} href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive href="#">{page}</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext onClick={(e) => { e.preventDefault(); onPageChange?.(Math.min(totalPages, page + 1)) }} href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {pendingDeleteIds.length} record{pendingDeleteIds.length !== 1 ? 's' : ''}? 
              This action can be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
