//app/suite/admin/temp-excelpayrun-import/page.tsx

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { PayslipFiltersAndTable, type PayslipRow } from '@/components/payroll/PayslipFiltersAndTable'
import { PayslipEmailFlow } from '@/components/payroll/PayslipEmailFlow'
import PayslipGenerateFlow from '@/components/payroll/PayslipGenerateFlow'
import PayslipCSVImportDialog from '@/components/payroll/PayslipCSVImportDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/react-ui/card'

export default function SendPayslipsPage() {
  const [rows, setRows] = useState<PayslipRow[]>([])
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [step, setStep] = useState<'select' | 'generate' | 'review'>('select')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(200)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filteredRows, setFilteredRows] = useState<PayslipRow[]>([])
  const [importOpen, setImportOpen] = useState(false)
  
  // Filter states
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('') // For immediate UI updates
  const [selectedEmployers, setSelectedEmployers] = useState<Set<string>>(new Set())
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())

  // Simple debounce implementation
  const searchTimeout = useRef<NodeJS.Timeout>()
  const debouncedSetSearch = useCallback((value: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = setTimeout(() => {
      setSearch(value)
      setPage(1) // Reset to page 1 when search changes
    }, 500)
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchInput(value) // Update UI immediately
    debouncedSetSearch(value) // Update actual search state with debounce
  }

  const refreshData = useCallback(async () => {
    try {
      const offset = (page - 1) * pageSize
      const params = new URLSearchParams({ 
        limit: String(pageSize), 
        offset: String(offset), 
        sortBy, 
        sortDir 
      })
      
      // Add search and filter parameters
      if (search.trim()) {
        params.set('search', search.trim())
      }
      if (selectedEmployers.size > 0) {
        params.set('employers', Array.from(selectedEmployers).join(','))
      }
      if (selectedDates.size > 0) {
        params.set('dates', Array.from(selectedDates).join(','))
      }
      
      const res = await fetch(`/api/admin/payslips/list?${params.toString()}`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      const rows: PayslipRow[] = (json.rows as any[])?.map((r: any) => ({
        batch_id: r.id, // Map id to batch_id for compatibility
        employer_name: r.employer_name,
        employee_name: r.employee_name,
        reviewer_email: r.reviewer_email,
        email_id: r.email_id,
        net_salary: r.net_salary,
        currency: r.currency,
        payslip_url: r.payslip_url,
        payslip_token: r.payslip_token,
        created_at: r.created_at,
        pay_period_to: r.pay_period_to,
        last_sent_at: r.last_sent_at || null,
        // Include all additional fields for export
        ...r
      })) ?? []
      setRows(rows)
      setTotal(Number(json.total || 0))
    } catch (e: any) {
      toast({ title: 'Error refreshing data', description: e.message, variant: 'destructive' })
    }
  }, [page, pageSize, sortBy, sortDir, search, selectedEmployers, selectedDates])

  const handleFilteredRowsChange = useCallback((filteredRows: PayslipRow[]) => {
    setFilteredRows(filteredRows)
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Send Payslips</CardTitle>
              <CardDescription>
                Generate payslips, send emails to employees, and manage payroll distribution for all employers.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-white text-sm bg-neutral-700 px-3 py-2 rounded-md shadow-xs hover:opacity-90"
                onClick={() => setImportOpen(true)}
              >
                Import Rows
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>
      {step === 'select' ? (
        <PayslipFiltersAndTable
          rows={rows}
          selected={selected}
          onSelectionChange={setSelected}
          onProceedToEmail={() => setStep('review')}
          onProceedToGenerate={() => setStep('generate')}
          onFilteredRowsChange={handleFilteredRowsChange}
          onPayrunSuccess={refreshData}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => { setPageSize(n); setPage(1) }}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={(field) => {
            if (sortBy === field) {
              setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
            } else {
              setSortBy(field)
              setSortDir('asc')
            }
            setPage(1)
          }}
          onClearSort={() => { setSortBy('created_at'); setSortDir('desc'); setPage(1) }}
          // Filter props
          search={searchInput} // Use immediate search for UI
          onSearchChange={handleSearchChange}
          selectedEmployers={selectedEmployers}
          onEmployersChange={(employers) => {
            setSelectedEmployers(employers)
            setPage(1)
          }}
          selectedDates={selectedDates}
          onDatesChange={(dates) => {
            setSelectedDates(dates)
            setPage(1)
          }}
          onFiltersChange={() => setPage(1)} // Reset to page 1 when filters change
        />
      ) : step === 'generate' ? (
        <PayslipGenerateFlow
          rows={filteredRows}
          selected={selected}
          onBack={() => setStep('select')}
          onDone={async () => {
            setStep('select')
            // Use refreshData to maintain filter state
            refreshData()
          }}
        />
      ) : (
        <PayslipEmailFlow
          rows={filteredRows}
          selected={selected}
          onBack={() => setStep('select')}
          onRefresh={refreshData}
        />
      )}
      
      <PayslipCSVImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={refreshData}
      />
    </div>
  )
}
