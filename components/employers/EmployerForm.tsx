'use client'

import React, { useState } from 'react'
import { TextField } from '@/components/forms/FormField'
import { Button } from '@/components/react-ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/react-ui/card'
import { useToast } from '@/hooks/use-toast'
import { Download } from 'lucide-react'

interface EmployerFormData {
  name: string
  reviewer_email: string
}

interface EmployerFormProps {
  initialData?: EmployerFormData & { id: string }
  onSuccess?: (data: any) => void
  onCancel?: () => void
}

export default function EmployerForm({ initialData, onSuccess, onCancel }: EmployerFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<EmployerFormData>({
    name: initialData?.name || '',
    reviewer_email: initialData?.reviewer_email || ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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
      errors.name = 'Company name is required'
    }
    
    if (!formData.reviewer_email.trim()) {
      errors.reviewer_email = 'Reviewer email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.reviewer_email)) {
      errors.reviewer_email = 'Please enter a valid email address'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/employers/template')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'employers-template.csv'
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
        ? `/api/employers/${initialData.id}`
        : '/api/employers'
      
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
        description: `Employer ${initialData ? 'updated' : 'created'} successfully`,
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

  return (
    <Card className="w-full max-w-md bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {initialData ? 'Edit Employer' : 'Add New Employer'}
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
              label="Company Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter company name"
              required
            />
            {validationErrors.name && (
              <p className="text-xs text-destructive font-medium">{validationErrors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <TextField
              label="Reviewer Email"
              name="reviewer_email"
              type="email"
              value={formData.reviewer_email}
              onChange={handleChange}
              placeholder="reviewer@company.com"
              required
              description="Email address for payroll review notifications"
            />
            {validationErrors.reviewer_email && (
              <p className="text-xs text-destructive font-medium">{validationErrors.reviewer_email}</p>
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
