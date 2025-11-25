'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/react-ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/react-ui/table'
import { Checkbox } from '@/components/react-ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Trash2, Copy, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { ActionToolbar } from '@/components/react-layout/ActionToolbar'

interface Employee {
  id: string
  name: string
  email_id: string | null
  employee_mol: string | null
  bank_name: string | null
  iban: string | null
  employer_id: string
  created_at: string
  updated_at: string
  employer: {
    id: string
    name: string
    reviewer_email: string
  }
}

interface EmployeeListProps {
  onEdit?: (employee: Employee) => void
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (field: string) => void
  selected?: Set<string>
  onSelectionChange?: (selected: Set<string>) => void
}

export default function EmployeeList({ 
  onEdit,
  search = '',
  sortBy = 'created_at',
  sortDir = 'desc',
  onSort,
  selected = new Set(),
  onSelectionChange,
}: EmployeeListProps) {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load employees')
      }
      
      setEmployees(result.data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load employees',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete "${employee.name}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(employee.id)
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete employee')
      }
      
      setEmployees(prev => prev.filter(e => e.id !== employee.id))
      
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete employee',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      })
    }).catch(() => {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      })
    })
  }
  
  // Filter employees based on search
  const filtered = useMemo(() => {
    if (!search.trim()) return employees
    const searchLower = search.toLowerCase()
    return employees.filter(emp => 
      emp.name?.toLowerCase().includes(searchLower) ||
      emp.email_id?.toLowerCase().includes(searchLower) ||
      emp.employee_mol?.toLowerCase().includes(searchLower) ||
      emp.employer?.name?.toLowerCase().includes(searchLower) ||
      emp.bank_name?.toLowerCase().includes(searchLower) ||
      emp.iban?.toLowerCase().includes(searchLower)
    )
  }, [employees, search])
  
  // Sort filtered employees
  const sorted = useMemo(() => {
    const sorted = [...filtered]
    sorted.sort((a, b) => {
      let aVal: any = a[sortBy as keyof Employee]
      let bVal: any = b[sortBy as keyof Employee]
      
      // Handle nested properties
      if (sortBy === 'employer') {
        aVal = a.employer?.name
        bVal = b.employer?.name
      }
      
      // Handle nulls
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      
      // Handle dates
      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }
      
      // Compare
      const comparison = typeof aVal === 'string' 
        ? aVal.localeCompare(bVal)
        : aVal - bVal
      
      return sortDir === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [filtered, sortBy, sortDir])
  
  const toggleSelection = (id: string) => {
    if (!onSelectionChange) return
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange(next)
  }
  
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    const next = checked ? new Set(sorted.map(e => e.id)) : new Set<string>()
    onSelectionChange(next)
  }
  
  const handleExportCSV = () => {
    const rowsToExport = selected.size > 0 
      ? sorted.filter(e => selected.has(e.id))
      : sorted
    
    if (rowsToExport.length === 0) {
      toast({
        title: 'No data to export',
        description: 'Please select rows or ensure there is data to export',
        variant: 'destructive',
      })
      return
    }
    
    try {
      // Define CSV headers
      const headers = [
        'ID',
        'Name',
        'Email',
        'Employee MOL ID',
        'Bank Name',
        'IBAN',
        'Employer ID',
        'Employer Name',
        'Reviewer Email',
        'Created At',
        'Updated At'
      ]
      
      // Convert data to CSV rows
      const csvRows = [
        headers.join(','),
        ...rowsToExport.map(emp => [
          emp.id,
          emp.name || '',
          emp.email_id || '',
          emp.employee_mol || '',
          emp.bank_name || '',
          emp.iban || '',
          emp.employer_id,
          emp.employer?.name || '',
          emp.employer?.reviewer_email || '',
          emp.created_at,
          emp.updated_at
        ].map(field => {
          // Escape commas and quotes in CSV
          const str = String(field || '')
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }).join(','))
      ]
      
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `employees-export-${timestamp}.csv`
      
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
        description: `Exported ${rowsToExport.length} employee(s) to ${filename}`,
      })
    } catch (e: any) {
      toast({
        title: 'Export failed',
        description: e?.message || 'Unknown error occurred during export',
        variant: 'destructive',
      })
    }
  }
  
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading employees...</div>
      </div>
    )
  }

  const allSelected = sorted.length > 0 && sorted.every(e => selected.has(e.id))
  const someSelected = sorted.some(e => selected.has(e.id)) && !allSelected

  return (
    <div className="space-y-4">
      <ActionToolbar align="between">
        <div className="text-xs font-semibold text-green-600">
          Showing {sorted.length} of {employees.length} employee{employees.length !== 1 ? 's' : ''}
          {selected.size > 0 && (
            <span className="ml-2">• {selected.size} selected</span>
          )}
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleExportCSV}
          disabled={sorted.length === 0}
        >
          Export Selected (CSV)
        </Button>
      </ActionToolbar>
      
      {sorted.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          {employees.length === 0 
            ? 'No employees found. Add one to get started.'
            : 'No employees match your search criteria.'}
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-800 text-white">
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead><HeaderButton field="name" label="Name" /></TableHead>
                <TableHead><HeaderButton field="email_id" label="Email" /></TableHead>
                <TableHead><HeaderButton field="employer" label="Employer" /></TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Employer ID</TableHead>
                <TableHead><HeaderButton field="employee_mol" label="MOL ID" /></TableHead>
                <TableHead><HeaderButton field="bank_name" label="Bank" /></TableHead>
                <TableHead><HeaderButton field="created_at" label="Created" /></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(employee.id)}
                      onCheckedChange={() => toggleSelection(employee.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email_id || '-'}</TableCell>
                  <TableCell>{employee.employer?.name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {employee.id.substring(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(employee.id, 'Employee ID')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {employee.employer_id.substring(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(employee.employer_id, 'Employer ID')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{employee.employee_mol || '-'}</TableCell>
                  <TableCell>{employee.bank_name || '-'}</TableCell>
                  <TableCell>{formatDate(employee.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(employee)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee)}
                        disabled={deletingId === employee.id}
                      >
                        {deletingId === employee.id ? (
                          'Deleting...'
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
