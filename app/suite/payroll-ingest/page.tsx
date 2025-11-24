'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PayrollIngestGrid from '@/components/payroll/ingest/PayrollIngestGrid'
import type { IngestRow, IngestSortableField } from '@/lib/types/payrollIngest'
import { Button } from '@/components/react-ui/button'
import { Input } from '@/components/react-ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/react-ui/select'
import { toast } from '@/hooks/use-toast'
import * as XLSX from 'xlsx'
import { PageHeader } from '@/components/react-layout/PageHeader'
import { FilterBar } from '@/components/react-layout/FilterBar'
import { ActionToolbar } from '@/components/react-layout/ActionToolbar'

export default function PayrollIngestPage() {
  const [rows, setRows] = useState<IngestRow[]>([])
  const [total, setTotal] = useState(0)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(250)
  const [sortBy, setSortBy] = useState<IngestSortableField>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [currency, setCurrency] = useState<string>('')
  const [employers, setEmployers] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const visibleColumns = useMemo(() => {
    // A pragmatic initial set; can be adjusted later or made configurable
    return [
      { id: 'employee_name', title: 'Employee' },
      { id: 'employer_name', title: 'Employer' },
      { id: 'reviewer_email', title: 'Reviewer Email' },
      { id: 'email_id', title: 'Employee Email' },
      { id: 'currency', title: 'Currency', width: 100 },
      { id: 'pay_period_from', title: 'From', width: 120 },
      { id: 'pay_period_to', title: 'To', width: 120 },
      { id: 'net_salary', title: 'Net Salary', width: 140 },
      { id: 'total_to_transfer', title: 'Total To Transfer', width: 160 },
      { id: 'iban', title: 'IBAN', width: 220 },
    ]
  }, [])

  const fetchRows = useCallback(async () => {
    const offset = (page - 1) * pageSize
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      sortBy,
      sortDir,
    })
    if (search) params.set('search', search)
    if (currency) params.set('currency', currency)
    if (employers) params.set('employers', employers)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    const res = await fetch(`/api/admin/ingest/list?${params.toString()}`)
    if (!res.ok) throw new Error(await res.text())
    const json = await res.json()
    setRows(json.rows || [])
    setTotal(Number(json.total || 0))
  }, [page, pageSize, sortBy, sortDir, search, employers, currency, dateFrom, dateTo])

  useEffect(() => { fetchRows().catch(err => toast({ title: 'Load error', description: err.message, variant: 'destructive' })) }, [fetchRows])

  const onChangeCell = useCallback(async (id: string, columnId: string, value: any) => {
    // Optimistic
    setRows(prev => prev.map(r => r.id === id ? { ...r, [columnId]: value } as IngestRow : r))
    const res = await fetch('/api/admin/ingest/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, changes: { [columnId]: value } }),
    })
    if (!res.ok) {
      // revert
      await fetchRows()
      throw new Error(await res.text())
    }
    const json = await res.json()
    if (json?.row) {
      setRows(prev => prev.map(r => r.id === id ? json.row : r))
    }
  }, [fetchRows])

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))

  const handleExport = useCallback(() => {
    const data = rows.map(r => {
      const out: Record<string, any> = {}
      for (const c of visibleColumns) out[c.title] = (r as any)[c.id]
      return out
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ingest Rows')
    const ts = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `payroll-ingest-${ts}.xlsx`)
  }, [rows, visibleColumns])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Ingest"
        description="View and manage imported payroll data. Search, filter, and export payroll records for processing."
        breadcrumbs="Payroll Deck"
        actions={
          <Button onClick={handleExport}>
            Export
          </Button>
        }
      />

      <FilterBar align="between">
        <div className="flex flex-wrap items-center gap-3">
          <Input className="w-full max-w-xs" placeholder="Search employee, employer, email, IBAN..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <Input className="w-full max-w-[180px]" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
          <Input className="w-full max-w-[180px]" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
          <Input className="w-full max-w-xs" placeholder="Employers (csv)" value={employers} onChange={(e) => { setEmployers(e.target.value); setPage(1) }} />
          <Input className="w-full max-w-[140px]" placeholder="Currency (csv)" value={currency} onChange={(e) => { setCurrency(e.target.value); setPage(1) }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 text-white">
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="250">250</SelectItem>
              <SelectItem value="1000">1000</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <ActionToolbar subdued align="between">
        <div className="text-sm font-semibold text-slate-600">
          Showing {rows.length} of {total}
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-500">
          Sorted by {sortBy} · {sortDir.toUpperCase()}
        </div>
      </ActionToolbar>

      <PayrollIngestGrid rows={rows} onChangeCell={onChangeCell} visibleColumns={visibleColumns} />

      <ActionToolbar align="between" subdued>
        <Button variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
        <div className="text-sm text-slate-600">Page {page} / {totalPages}</div>
        <Button variant="ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
      </ActionToolbar>
    </div>
  )
}


