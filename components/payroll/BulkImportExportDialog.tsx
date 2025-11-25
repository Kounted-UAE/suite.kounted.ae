// components/bulk/BulkImportExportDialog.tsx

'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/react-ui/dialog'
import { Button } from '@/components/react-ui/button'
import { Input } from '@/components/react-ui/input'
import { Badge } from '@/components/react-ui/badge'
import Papa from 'papaparse'
import { z, ZodSchema } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { toast } from '@/hooks/use-toast'
import { Upload as UploadIcon } from 'lucide-react'
import { checkForDuplicates } from '@/lib/utils/checkForDuplicates'

// Function to create Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export type BulkImportExportDialogProps<T extends Record<string, any>> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectName: string
  tableName: string
  schema: ZodSchema<T>
  templateHeaders: string[]
  exampleRow: Partial<T>
  transform?: (row: T) => T | Promise<T>
  filters?: Record<string, any>
  deduplicationKeys?: (keyof T)[]
}

export function BulkImportExportDialog<T extends Record<string, any>>({
  open,
  onOpenChange,
  objectName,
  tableName,
  schema,
  templateHeaders,
  exampleRow,
  transform,
  filters,
  deduplicationKeys = ['email', 'emirates_id'] as (keyof T)[]
}: BulkImportExportDialogProps<T>) {
  const [tab, setTab] = useState<'import' | 'export' | 'template'>('import')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [validationResults, setValidationResults] = useState<{ valid: T[]; errors: { row: number; error: string }[] }>({ valid: [], errors: [] })
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Create Supabase client instance
  const supabase = createSupabaseClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[]
        setParsedRows(rows)

        const valid: (T & { __index: number })[] = []
        const errors: { row: number; error: string }[] = []

        // First pass: validate schema
        rows.forEach((row, idx) => {
          const parsed = schema.safeParse(row)
          if (parsed.success) {
            valid.push({ ...parsed.data, __index: idx + 2 })
          } else {
            errors.push({
              row: idx + 2,
              error: parsed.error.errors.map(e => e.message).join('; ')
            })
          }
        })

        // Second pass: apply transform if available
        let transformedRows = valid
        if (transform) {
          try {
            transformedRows = await Promise.all(
              valid.map(async (row) => {
                const transformed = await transform(row)
                return { ...transformed, __index: row.__index }
              })
            )
          } catch (err) {
            console.error('Transform error:', err)
            errors.push({
              row: 0,
              error: 'Transform function failed'
            })
          }
        }

        // Third pass: deduplication check (AFTER transform)
        try {
          const { data: existingRows, error: existingError } = await supabase
            .from(tableName)
            .select(deduplicationKeys.join(','))

          if (existingError || !existingRows) {
            toast({
              title: 'Deduplication Error',
              description: existingError?.message || 'Could not fetch existing records.',
              variant: 'destructive'
            })
            return
          }

          const { unique, duplicates } = checkForDuplicates<T>(
            transformedRows,
            existingRows as unknown as T[],
            deduplicationKeys
          )

          setValidationResults({
            valid: unique,
            errors: [
              ...errors,
              ...duplicates.map(d => ({
                row: (d as any).__index || 0,
                error: 'Duplicate employee (same first name, last name, and employer)'
              }))
            ]
          })
        } catch (err) {
          console.error('❌ Deduplication logic error:', err)
        }
      },
      error: (err) => {
        toast({ title: 'CSV Parse Error', description: err.message, variant: 'destructive' })
      }
    })
  }

  const handleCopyErrors = () => {
    const text = validationResults.errors.map(e => `Row ${e.row}: ${e.error}`).join('\n')
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied', description: 'Error messages copied to clipboard.' })
  }

  const handleImport = async () => {
    setImporting(true)
    let rows = validationResults.valid

    try {
      const cleanRows = rows.map(row => {
        const { __index, ...cleanRow } = row as any
        return cleanRow
      })

      if (cleanRows.length === 0) return

      const { error } = await supabase.from(tableName).insert(cleanRows)

      if (error) {
        toast({
          title: 'Import Error',
          description: error.message || 'Insert failed.',
          variant: 'destructive'
        })
        return
      }

      toast({
        title: 'Import Success',
        description: `Imported ${cleanRows.length} ${objectName}(s)`
      })
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast({ title: 'Import Error', description: 'Unexpected error', variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  const handleExport = async () => {
    setExporting(true);
    let query = supabase.from(tableName).select('*');
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    const { data, error } = await query;
    setExporting(false);
    if (error) {
      toast({ title: 'Export Error', description: error.message, variant: 'destructive' });
      return;
    }
    const csv = Papa.unparse(data, { columns: templateHeaders });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${objectName.toLowerCase()}s_export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Export Success', description: `Exported ${data.length} ${objectName.toLowerCase()}(s).` });
  };

  const handleDownloadTemplate = () => {
    setDownloading(true);
    const csv = Papa.unparse([exampleRow], { columns: templateHeaders });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${objectName.toLowerCase()}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  const resetImport = () => {
    setParsedRows([]);
    setValidationResults({ valid: [], errors: [] });
    setCsvFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (open) {
      setCsvFile(null);
      setParsedRows([]);
      setValidationResults({ valid: [], errors: [] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import/Export {objectName}s</DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={tab === 'import' ? 'default' : 'outline'}
            onClick={() => setTab('import')}
            className="w-40"
          >
            Import CSV
          </Button>
          <Button
            variant={tab === 'export' ? 'default' : 'outline'}
            onClick={() => setTab('export')}
            className="w-40"
          >
            Export CSV
          </Button>
          <Button
            variant={tab === 'template' ? 'default' : 'outline'}
            onClick={() => setTab('template')}
            className="w-40"
          >
            Download Template
          </Button>
        </div>


        {/* Import Tab */}
        {tab === 'import' && (
          <div className="space-y-6">
            {/* File Input */}
            <div>
              {/* Enhanced File Upload Label */}
              <div className="relative inline-block">
                <label
                  htmlFor="csv-upload"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-700  rounded-md bg-white cursor-pointer transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                >
                  <UploadIcon className="w-4 h-4" />
                  {csvFile ? csvFile.name : 'Upload CSV File'}
                </label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Preview and Validation Results */}
            {parsedRows.length > 0 && (
              <div className="space-y-4">
                {/* Preview Table */}
                <div>
                  <div className="mb-2 text-sm font-medium text-zinc-400">
                    Preview ({parsedRows.length} rows):
                  </div>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="bg-zinc-100">
                          {templateHeaders.map(h => (
                            <th key={h} className="px-3 py-2 text-left font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-t">
                            {templateHeaders.map(h => (
                              <td key={h} className="px-3 py-2">
                                {row[h] || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Validation Status */}
                <div className="flex items-center justify-between p-3 bg-zinc-100/50 rounded-lg">
                  {validationResults.errors.length > 0 ? (
                    <>
                      <Badge variant="destructive" className="text-sm">
                        {validationResults.errors.length} row(s) with errors
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyErrors}
                        className="text-xs"
                      >
                        Copy Errors
                      </Button>
                    </>
                  ) : (
                    <Badge variant="default" className="text-sm">
                      All rows valid
                    </Badge>
                  )}
                </div>


                {/* Error Details */}
                {validationResults.errors.length > 0 && (
                  <div className="border rounded-lg p-3">
                    <div className="text-sm font-medium mb-2 text-destructive">
                      Validation Errors:
                    </div>
                    <div className="max-h-32 overflow-y-auto text-xs text-destructive">
                      <ul className="space-y-1">
                        {validationResults.errors.map((err, i) => (
                          <li key={i} className="flex">
                            <span className="font-mono mr-2">Row {err.row}:</span>
                            <span>{err.error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Action Buttons - LEFT aligned */}
                <div className="flex justify-start gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={resetImport}
                    disabled={importing}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importing || validationResults.valid.length === 0}
                    className="min-w-[140px]"
                  >
                    {importing ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Importing...
                      </>
                    ) : (
                      `Import ${validationResults.valid.length} ${objectName}(s)`
                    )}
                  </Button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {tab === 'export' && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-100/50 rounded-lg">
              <div className="text-sm text-zinc-400 mb-4">
                Export all or filtered {objectName}s as CSV.
              </div>
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Exporting...
                  </>
                ) : (
                  'Export CSV'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Template Tab */}
        {tab === 'template' && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-100/50 rounded-lg">
              <div className="text-sm text-zinc-400 mb-4">
                Download a sample CSV template for {objectName}s.
              </div>
              <Button
                onClick={handleDownloadTemplate}
                disabled={downloading}
                className="w-full"
              >
                {downloading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Downloading...
                  </>
                ) : (
                  'Download Template'
                )}
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium mb-3">Template Fields:</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                {templateHeaders.map(h => (
                  <div key={h} className="flex items-center">
                    <span className="w-2 h-2 bg-zinc-500 rounded-full mr-2"></span>
                    {h}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
