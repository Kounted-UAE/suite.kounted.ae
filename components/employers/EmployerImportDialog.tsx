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

// Expected columns for employer import
const EXPECTED_COLUMNS = [
  'name',
  'reviewer_email'
]

function normalizeRow(input: Record<string, any>) {
  const row: Record<string, any> = {}

  EXPECTED_COLUMNS.forEach((key) => {
    row[key] = input[key]
  })

  // Trim strings
  ;['name', 'reviewer_email'].forEach(k => {
    if (row[k] != null) row[k] = String(row[k]).trim()
  })

  // Empty strings to null (except required fields)
  Object.keys(row).forEach(k => {
    if (row[k] === '') row[k] = null
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
      message: 'Employer name is required'
    })
  }
  
  // Required: reviewer_email
  if (!row.reviewer_email || !String(row.reviewer_email).trim()) {
    errors.push({
      row: index + 2,
      field: 'reviewer_email',
      message: 'Reviewer email is required'
    })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.reviewer_email)) {
    errors.push({
      row: index + 2,
      field: 'reviewer_email',
      message: 'Invalid email format'
    })
  }
  
  return errors
}

export default function EmployerImportDialog({ open, onOpenChange, onSuccess }: Props) {
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

      const response = await fetch('/api/employers/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employers: cleanRows }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      toast({
        title: 'Import Successful',
        description: `Successfully imported ${result.imported} employer${result.imported !== 1 ? 's' : ''}`,
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
      const response = await fetch('/api/employers/template')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'employers-import-template.csv'
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
          <DialogTitle className="text-xs">Import Employers</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative inline-block">
                <label htmlFor="csv-upload" className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white rounded-md bg-zinc-600 cursor-pointer hover:opacity-90">
                  {file ? file.name : 'Choose CSV file'}
                </label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  ref={fileRef}
                  onChange={handleFile}
                  className="hidden"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="text-xs"
              >
                Download Template
              </Button>
            </div>
            
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3">
              <p className="font-semibold mb-1">Required columns:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code className="text-xs bg-white px-1 py-0.5 rounded">name</code> - Employer name (required)</li>
                <li><code className="text-xs bg-white px-1 py-0.5 rounded">reviewer_email</code> - Reviewer email address (required)</li>
              </ul>
              <p className="mt-2 text-slate-500">Rows missing required fields will be skipped during import.</p>
              <div className="mt-3 pt-3 border-t border-slate-300">
                <p className="font-semibold mb-1">Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Employer name must be unique</li>
                  <li><code className="text-xs bg-white px-1 py-0.5 rounded">reviewer_email</code> is used for payroll notifications and must be a valid email address</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Validation Status */}
          {cleanRows.length > 0 && (
            <div className="space-y-4">
              {/* Column Validation */}
              {hasColumnMismatch && (
                <div className="rounded-lg border border-red-200 bg-zinc-100 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-red-900">Missing Required Columns</h4>
                      <p className="text-xs text-red-700 mt-1">
                        The following columns are missing: {missingColumns.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Row Validation Summary */}
              <div className={`rounded-lg border p-4 ${
                validationErrors.length === 0 
                  ? 'border-green-200 bg-zinc-100' 
                  : 'border-yellow-200 bg-zinc-100'
              }`}>
                <div className="flex items-start gap-3">
                  {validationErrors.length === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`text-xs font-semibold ${
                      validationErrors.length === 0 ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      Validation Results
                    </h4>
                    <div className="mt-2 space-y-1 text-xs">
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
                <div className="rounded-lg border border-red-200 bg-zinc-100 p-4">
                  <h4 className="text-xs font-semibold text-red-900 mb-3">Validation Errors</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {validationErrors.map((error, idx) => (
                      <div key={idx} className="text-xs text-red-800 bg-zinc-100 rounded p-2 border border-red-100">
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
                  <h4 className="text-xs font-semibold text-slate-900">Data Preview</h4>
                  <p className="text-xs font-semibold text-green-600 mt-1">
                    Showing first {Math.min(5, cleanRows.length)} rows
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
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
                          <tr key={idx} className={hasError ? 'bg-zinc-100' : 'bg-white'}>
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
            <div className="rounded-lg border border-blue-200 bg-zinc-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-900">
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

