'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/react-ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/react-ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/react-ui/table'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Trash2, Plus, Copy } from 'lucide-react'

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
  onAdd?: () => void
}

export default function EmployeeList({ onEdit, onAdd }: EmployeeListProps) {
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Employees</CardTitle>
        {onAdd && (
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No employees found. Add one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employer</TableHead>
                  <TableHead>Employer ID</TableHead>
                  <TableHead>MOL ID</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
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
                    <TableCell>{employee.email_id || '-'}</TableCell>
                    <TableCell>{employee.employer.name}</TableCell>
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
      </CardContent>
    </Card>
  )
}
