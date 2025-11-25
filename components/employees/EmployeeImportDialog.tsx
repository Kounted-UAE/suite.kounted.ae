'use client'

import React, { useEffect, useRef, useState } from 'react'
import Papa from 'papaparse'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/react-ui/dialog'
import { Button } from '@/components/react-ui/button'
import { Badge } from '@/components/react-ui/badge'
import { Input } from '@/components/react-ui/input'
import { toast } from '@/hooks/use-toast'
import { AlertCircle, CheckCircle, Upload, Download } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Expected columns for employee import
const EXPECTED_COLUMNS = [
  'name',
  'email_id',
  'employee_mol',
  'bank_name',
  'iban',
  'employer_id'
]

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

function cleanUUID(value: any): string | null {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  if (trimmed === '') return null
  
  // Remove any extra quotes that might have been added
  const cleaned = trimmed.replace(/^["']|["']$/g, '')
  
  return isValidUUID(cleaned) ? cleaned : null
}

function normalizeRow(input: Record<string, any>) {
  const row: Record<string, any> = {}

  EXPECTED_COLUMNS.forEach((key) => {
    row[key] = input[key]
  })

  // Trim strings
  ;['name', 'email_id', 'employee_mol', 'bank_name', 'iban'].forEach(k => {
    if (row[k] != null) row[k] = String(row[k]).trim()
  })

  // UUIDs - clean and validate
  row['employer_id'] = cleanUUID(row['employer_id'])

  // Empty strings to null (except name which is required)
  Object.keys(row).forEach(k => {
    if (row[k] === '' && k !== 'name') row[k] = null
  })

  return row
}

interface ValidationError {
  row: number
  field: string
  message: string
}

function validateRow(row: Record<string, any>, index: number): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Required: name
  if (!row.name || !String(row.name).trim()) {
    errors.push({
      row: index + 2, // +2 because Excel row 1 is headers, and we want 1-based indexing
      field: 'name',
      message: 'Employee name is required'
    })
  }
  
  // Required: employer_id (must be valid UUID)
  if (!row.employer_id) {
    errors.push({
      row: index + 2,
      field: 'employer_id',
      message: 'Employer ID is required'
    })
  } else if (!isValidUUID(row.employer_id)) {
    errors.push({
      row: index + 2,
      field: 'employer_id',
      message: 'Invalid employer ID format (must be a valid UUID)'
    })
  }
  
  // Optional but validate if provided: email_id
  if (row.email_id && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email_id)) {
    errors.push({
      row: index + 2,
      field: 'email_id',
      message: 'Invalid email format'
    })
  }
  
  // Optional but validate if provided: iban
  if (row.iban && (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(row.iban) || row.iban.length < 15 || row.iban.length > 34)) {
    errors.push({
      row: index + 2,
      field: 'iban',
      message: 'Invalid IBAN format'
    })
  }
  
  return errors
}

export default function EmployeeImportDialog({ open, onOpenChange, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [cleanRows, setCleanRows] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setParsedRows([])
      setCleanRows([])
      setValidationErrors([])
      setImportProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [open])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = (result.data as any[]).filter(r => Object.values(r).some(v => String(v).trim() !== ''))
        const provided = (result.meta.fields || []).filter(Boolean) as string[]
        const normalized = rows.map(normalizeRow)
        
        // Validate all rows
        const allErrors: ValidationError[] = []
        normalized.forEach((row, idx) => {
          const rowErrors = validateRow(row, idx)
          allErrors.push(...rowErrors)
        })
        
        setParsedRows(rows)
        setCleanRows(normalized)
        setColumns(provided)
        setValidationErrors(allErrors)
      },
      error: (err) => {
        toast({ title: 'CSV parse error', description: err.message, variant: 'destructive' })
      }
    })
  }

  const handleImport = async () => {
    if (cleanRows.length === 0) return
    
    // Don't allow import if there are validation errors
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Errors',
        description: 'Please fix all validation errors before importing',
        variant: 'destructive'
      })
      return
    }

    try {
      setImporting(true)
      setImportProgress({ current: 0, total: cleanRows.length })

      const response = await fetch('/api/employees/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employees: cleanRows }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      toast({
        title: 'Import Successful',
        description: `Successfully imported ${result.imported} employee${result.imported !== 1 ? 's' : ''}`,
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
      setImportProgress(null)
    }
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

  const missingColumns = EXPECTED_COLUMNS.filter(col => !columns.includes(col))
  const hasColumnMismatch = missingColumns.length > 0
  const validRowCount = cleanRows.length - validationErrors.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Import Employees</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                Upload CSV File
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                className="flex-1"
              />
              {file && (
                <Badge variant="outline" className="whitespace-nowrap">
                  {file.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Validation Status */}
          {cleanRows.length > 0 && (
            <div className="space-y-4">
              {/* Column Validation */}
              {hasColumnMismatch && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900">Missing Required Columns</h4>
                      <p className="text-sm text-red-700 mt-1">
                        The following columns are missing: {missingColumns.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Row Validation Summary */}
              <div className={`rounded-lg border p-4 ${
                validationErrors.length === 0 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-yellow-200 bg-yellow-50'
              }`}>
                <div className="flex items-start gap-3">
                  {validationErrors.length === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      validationErrors.length === 0 ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      Validation Results
                    </h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-slate-700">
                        <strong>{cleanRows.length}</strong> total rows parsed
                      </p>
                      <p className="text-green-700">
                        <strong>{validRowCount}</strong> valid rows ready to import
                      </p>
                      {validationErrors.length > 0 && (
                        <p className="text-red-700">
                          <strong>{validationErrors.length}</strong> validation errors found
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h4 className="font-semibold text-red-900 mb-3">Validation Errors</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {validationErrors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-800 bg-white rounded p-2 border border-red-100">
                        <span className="font-semibold">Row {error.row}:</span>{' '}
                        <span className="font-medium">{error.field}</span> - {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="rounded-lg border border-slate-200">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h4 className="font-semibold text-slate-900">Data Preview</h4>
                  <p className="text-xs font-semibold text-green-600 mt-1">
                    Showing first {Math.min(5, cleanRows.length)} rows
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Row</th>
                        {EXPECTED_COLUMNS.map(col => (
                          <th key={col} className="px-3 py-2 text-left font-semibold text-slate-700">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {cleanRows.slice(0, 5).map((row, idx) => {
                        const rowErrors = validationErrors.filter(e => e.row === idx + 2)
                        const hasError = rowErrors.length > 0
                        
                        return (
                          <tr key={idx} className={hasError ? 'bg-red-50' : 'bg-white'}>
                            <td className="px-3 py-2 text-slate-600 font-medium">{idx + 2}</td>
                            {EXPECTED_COLUMNS.map(col => {
                              const hasFieldError = rowErrors.some(e => e.field === col)
                              return (
                                <td 
                                  key={col} 
                                  className={`px-3 py-2 text-slate-900 ${hasFieldError ? 'text-red-700 font-semibold' : ''}`}
                                >
                                  {row[col] || <span className="text-slate-400">—</span>}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {importProgress && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Importing... {importProgress.current} of {importProgress.total}
                  </p>
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(importProgress.current / importProgress.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={!file || cleanRows.length === 0 || validationErrors.length > 0 || hasColumnMismatch || importing}
              className="min-w-[120px]"
            >
              {importing ? (
                <>Importing...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {validRowCount > 0 && `(${validRowCount})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

