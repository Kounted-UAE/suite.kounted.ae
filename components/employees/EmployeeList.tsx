'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/react-ui/button'
import { Card, CardContent } from '@/components/react-ui/card'
import {
  DataTable,
  DataTableBody,
  DataTableCheckboxCell,
  DataTableHeader,
  DataTableRow,
  StickyCell,
  StickyHeadCell,
  BaseTableRow,
  BaseTableCell,
  DataTableHead,
  DataTableSelectionHeadCell,
} from '@/components/react-layout/DataTable'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Trash2, Copy } from 'lucide-react'

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
}

export default function EmployeeList({ onEdit }: EmployeeListProps) {
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

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="text-center">Loading employees...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        {employees.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No employees found. Add one to get started.
          </div>
        ) : (
          <DataTable
            selectable
            stickyColumnWidth={260}
            containerClassName="max-h-[65vh]"
            rowCount={employees.length}
            allRowIds={employees.map((employee) => employee.id)}
          >
            <DataTableHeader className="bg-white">
              <BaseTableRow>
                <DataTableSelectionHeadCell />
                <StickyHeadCell>Name</StickyHeadCell>
                <DataTableHead>Employee ID</DataTableHead>
                <DataTableHead>Email</DataTableHead>
                <DataTableHead>Employer</DataTableHead>
                <DataTableHead>Employer ID</DataTableHead>
                <DataTableHead>MOL ID</DataTableHead>
                <DataTableHead>Bank</DataTableHead>
                <DataTableHead>Created</DataTableHead>
                <DataTableHead className="text-right">Actions</DataTableHead>
              </BaseTableRow>
            </DataTableHeader>
            <DataTableBody>
              {employees.map((employee) => (
                <DataTableRow key={employee.id} rowId={employee.id}>
                  <DataTableCheckboxCell rowId={employee.id} />
                  <StickyCell>{employee.name}</StickyCell>
                  <BaseTableCell>
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
                  </BaseTableCell>
                  <BaseTableCell>{employee.email_id || '-'}</BaseTableCell>
                  <BaseTableCell>{employee.employer.name}</BaseTableCell>
                  <BaseTableCell>
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
                  </BaseTableCell>
                  <BaseTableCell>{employee.employee_mol || '-'}</BaseTableCell>
                  <BaseTableCell>{employee.bank_name || '-'}</BaseTableCell>
                  <BaseTableCell>{formatDate(employee.created_at)}</BaseTableCell>
                  <BaseTableCell className="text-right">
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
                  </BaseTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </CardContent>
    </Card>
  )
}
