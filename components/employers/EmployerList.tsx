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

interface Employer {
  id: string
  name: string
  reviewer_email: string
  created_at: string
  updated_at: string
}

interface EmployerListProps {
  onEdit?: (employer: Employer) => void
}

export default function EmployerList({ onEdit }: EmployerListProps) {
  const { toast } = useToast()
  const [employers, setEmployers] = useState<Employer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadEmployers = async () => {
    try {
      const response = await fetch('/api/employers')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load employers')
      }
      
      setEmployers(result.data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load employers',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEmployers()
  }, [])

  const handleDelete = async (employer: Employer) => {
    if (!confirm(`Are you sure you want to delete "${employer.name}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(employer.id)
    try {
      const response = await fetch(`/api/employers/${employer.id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete employer')
      }
      
      setEmployers(prev => prev.filter(e => e.id !== employer.id))
      
      toast({
        title: 'Success',
        description: 'Employer deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete employer',
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
          <div className="text-center">Loading employers...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        {employers.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No employers found. Add one to get started.
          </div>
        ) : (
          <DataTable
            selectable
            stickyColumnWidth={240}
            containerClassName="max-h-[65vh]"
            rowCount={employers.length}
            allRowIds={employers.map((employer) => employer.id)}
          >
            <DataTableHeader className="bg-white">
              <BaseTableRow>
                <DataTableSelectionHeadCell />
                <StickyHeadCell>Company Name</StickyHeadCell>
                <DataTableHead>Employer ID</DataTableHead>
                <DataTableHead>Reviewer Email</DataTableHead>
                <DataTableHead>Created</DataTableHead>
                <DataTableHead className="text-right">Actions</DataTableHead>
              </BaseTableRow>
            </DataTableHeader>
            <DataTableBody>
              {employers.map((employer) => (
                <DataTableRow key={employer.id} rowId={employer.id}>
                  <DataTableCheckboxCell rowId={employer.id} />
                  <StickyCell>{employer.name}</StickyCell>
                  <BaseTableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {employer.id.substring(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(employer.id, 'Employer ID')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </BaseTableCell>
                  <BaseTableCell>{employer.reviewer_email}</BaseTableCell>
                  <BaseTableCell>{formatDate(employer.created_at)}</BaseTableCell>
                  <BaseTableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(employer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employer)}
                        disabled={deletingId === employer.id}
                      >
                        {deletingId === employer.id ? (
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
