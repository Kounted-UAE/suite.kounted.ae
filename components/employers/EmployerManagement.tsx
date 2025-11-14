'use client'

import React, { useCallback, useEffect, useState } from 'react'
import EmployerForm from './EmployerForm'
import EmployerList from './EmployerList'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/react-ui/dialog'

interface Employer {
  id: string
  name: string
  reviewer_email: string
  created_at: string
  updated_at: string
}

interface EmployerManagementProps {
  registerActions?: (actions: { openCreate: () => void }) => void
}

export default function EmployerManagement({ registerActions }: EmployerManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdd = useCallback(() => {
    setEditingEmployer(null)
    setIsFormOpen(true)
  }, [])

  const handleEdit = (employer: Employer) => {
    setEditingEmployer(employer)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingEmployer(null)
    // Trigger a refresh of the list
    setRefreshKey(prev => prev + 1)
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingEmployer(null)
  }

  useEffect(() => {
    if (registerActions) {
      registerActions({ openCreate: handleAdd })
    }
  }, [handleAdd, registerActions])

  return (
    <div className="space-y-6">
      <div key={refreshKey}>
        <EmployerList onEdit={handleEdit} />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingEmployer ? 'Edit Employer' : 'Add New Employer'}
            </DialogTitle>
          </DialogHeader>
          <EmployerForm
            initialData={editingEmployer || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
