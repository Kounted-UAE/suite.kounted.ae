'use client'

import React, { useState } from 'react'
import EmployeeForm from './EmployeeForm'
import EmployeeList from './EmployeeList'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/react-ui/dialog'

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

export default function EmployeeManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdd = () => {
    setEditingEmployee(null)
    setIsFormOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingEmployee(null)
    // Trigger a refresh of the list
    setRefreshKey(prev => prev + 1)
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingEmployee(null)
  }

  return (
    <div className="space-y-6">
      <div key={refreshKey}>
        <EmployeeList onAdd={handleAdd} onEdit={handleEdit} />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
          </DialogHeader>
          <EmployeeForm
            initialData={editingEmployee || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
