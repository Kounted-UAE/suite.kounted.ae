'use client'

import React, { useState, useEffect } from 'react'
import { TextField, SelectField } from '@/components/forms/FormField'
import { Button } from '@/components/react-ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/react-ui/card'
import { useToast } from '@/hooks/use-toast'
import { Download } from 'lucide-react'

interface EmployeeFormData {
  name: string
  email_id: string
  employee_mol: string
  bank_name: string
  iban: string
  employer_id: string
}

interface EmployeeFormProps {
  initialData?: EmployeeFormData & { id: string }
  onSuccess?: (data: any) => void
  onCancel?: () => void
}

interface Employer {
  id: string
  name: string
  reviewer_email: string
}

export default function EmployeeForm({ initialData, onSuccess, onCancel }: EmployeeFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [employers, setEmployers] = useState<Employer[]>([])
  const [loadingEmployers, setLoadingEmployers] = useState(true)
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: initialData?.name || '',
    email_id: initialData?.email_id || '',
    employee_mol: initialData?.employee_mol || '',
    bank_name: initialData?.bank_name || '',
    iban: initialData?.iban || '',
    employer_id: initialData?.employer_id || ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadEmployers = async () => {
      try {
        const response = await fetch('/api/employers')
        const result = await response.json()
        
        if (response.ok) {
          setEmployers(result.data || [])
        } else {
          throw new Error(result.error || 'Failed to load employers')
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load employers',
          variant: 'destructive',
        })
      } finally {
        setLoadingEmployers(false)
      }
    }

    loadEmployers()
  }, [toast])

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Employee name is required'
    }
    
    if (!formData.employer_id) {
      errors.employer_id = 'Employer is required'
    }
    
    if (formData.email_id && formData.email_id.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_id)) {
      errors.email_id = 'Please enter a valid email address'
    }
    
    if (formData.iban && formData.iban.trim()) {
      // Basic IBAN validation - should start with country code and be 15-34 characters
      if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(formData.iban) || formData.iban.length < 15 || formData.iban.length > 34) {
        errors.iban = 'Please enter a valid IBAN (e.g., AE123456789012345678901)'
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/employees/template')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'employees-template.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Template Downloaded',
          description: 'CSV template has been downloaded successfully',
        })
      } else {
        throw new Error('Failed to download template')
      }
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download CSV template',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)

    try {
      const url = initialData 
        ? `/api/employees/${initialData.id}`
        : '/api/employees'
      
      const method = initialData ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong')
      }

      toast({
        title: 'Success',
        description: `Employee ${initialData ? 'updated' : 'created'} successfully`,
      })

      onSuccess?.(result.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingEmployers) {
    return (
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-6">
          <div className="text-center">Loading employers...</div>
        </CardContent>
      </Card>
    )
  }

  const employerOptions = employers.map(employer => ({
    value: employer.id,
    label: employer.name
  }))

  return (
    <Card className="w-full max-w-md bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {initialData ? 'Edit Employee' : 'Add New Employee'}
          </CardTitle>
          {!initialData && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              CSV Template
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <TextField
              label="Employee Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter employee name"
              required
            />
            {validationErrors.name && (
              <p className="text-xs text-destructive font-medium">{validationErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <SelectField
              label="Employer"
              name="employer_id"
              value={formData.employer_id}
              onChange={handleChange}
              options={employerOptions}
              placeholder="Select employer"
              required
            />
            {validationErrors.employer_id && (
              <p className="text-xs text-destructive font-medium">{validationErrors.employer_id}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <TextField
              label="Email Address"
              name="email_id"
              type="email"
              value={formData.email_id}
              onChange={handleChange}
              placeholder="employee@company.com (optional)"
              description="Employee's work email address. Leave blank if payslips go to HR contact."
            />
            {validationErrors.email_id && (
              <p className="text-xs text-destructive font-medium">{validationErrors.email_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <TextField
              label="MOL ID"
              name="employee_mol"
              value={formData.employee_mol}
              onChange={handleChange}
              placeholder="Ministry of Labour ID"
              description="Employee's Ministry of Labour identification"
            />
            {validationErrors.employee_mol && (
              <p className="text-xs text-destructive font-medium">{validationErrors.employee_mol}</p>
            )}
          </div>

          <div className="space-y-2">
            <TextField
              label="Bank Name"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              placeholder="Bank name"
            />
            {validationErrors.bank_name && (
              <p className="text-xs text-destructive font-medium">{validationErrors.bank_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <TextField
              label="IBAN"
              name="iban"
              value={formData.iban}
              onChange={handleChange}
              placeholder="AE123456789012345678901"
              description="International Bank Account Number"
            />
            {validationErrors.iban && (
              <p className="text-xs text-destructive font-medium">{validationErrors.iban}</p>
            )}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
