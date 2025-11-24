'use client'

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import type { IngestRow } from '@/lib/types/payrollIngest'

// Lazy import to avoid hard dependency during initial wiring; the project will add the package later
let DataEditor: any
let glideDataGridLoaded = false

const loadGlideDataGrid = async () => {
  if (glideDataGridLoaded || DataEditor) return
  try {
    if (typeof window !== 'undefined') {
      const module = await import('@glideapps/glide-data-grid')
      DataEditor = module.DataEditor
      glideDataGridLoaded = true
    }
  } catch {
    // Package not available, will use fallback
  }
}

type Props = {
  rows: IngestRow[]
  onChangeCell: (id: string, columnId: string, value: any) => Promise<void>
  visibleColumns: { id: string; title: string; width?: number }[]
}

export default function PayrollIngestGrid({ rows, onChangeCell, visibleColumns }: Props) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [isGlideLoaded, setIsGlideLoaded] = useState(false)

  useEffect(() => {
    loadGlideDataGrid().then(() => {
      setIsGlideLoaded(true)
    })
  }, [])

  const handleCellEdited = useCallback(async (rowIdx: number, colIdx: number, rawValue: any) => {
    const row = rows[rowIdx]
    const col = visibleColumns[colIdx]
    if (!row || !col) return
    try {
      await onChangeCell(row.id, col.id, rawValue)
      setEditingKey(`${row.id}:${col.id}:${Date.now()}`)
      toast({ title: 'Saved' })
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Unknown error', variant: 'destructive' })
    }
  }, [rows, visibleColumns, onChangeCell])

  // Fallback simple table if glide grid is not available (during CI or until dependency is installed)
  if (!isGlideLoaded || !DataEditor) {
    return (
      <div className="overflow-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-white">
            <tr>
              {visibleColumns.map(c => (
                <th key={c.id} className="text-left p-2 whitespace-nowrap">{c.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                {visibleColumns.map(c => (
                  <td key={c.id} className="p-2 align-top">
                    <input
                      className="w-full bg-transparent border border-transparent hover:border-zinc-200 focus:border-zinc-300 rounded px-2 py-1"
                      defaultValue={(r as any)[c.id] ?? ''}
                      onBlur={async (e) => {
                        const v = e.currentTarget.value
                        if (String(v) !== String((r as any)[c.id] ?? '')) {
                          await handleCellEdited(rows.indexOf(r), visibleColumns.indexOf(c), v)
                        }
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Minimal binding to DataEditor; richer editors can be added incrementally
  const columns = useMemo(() => visibleColumns.map(c => ({
    id: c.id,
    title: c.title,
    width: c.width ?? 180,
  })), [visibleColumns])

  const getCellContent = useCallback((cell: any) => {
    const [col, row] = cell
    const rowData = rows[row]
    const colDef = columns[col]
    const value = rowData ? (rowData as any)[colDef.id] : ''
    return {
      kind: 'text',
      allowOverlay: true,
      displayData: value == null ? '' : String(value),
      data: value == null ? '' : String(value),
    }
  }, [rows, columns])

  const onCellEdited = useCallback(async (cell: any, newValue: any) => {
    const [col, row] = cell
    const rowData = rows[row]
    const colDef = columns[col]
    if (!rowData || !colDef) return
    await handleCellEdited(row, col, (newValue?.data ?? newValue))
  }, [rows, columns, handleCellEdited])

  return (
    <div className="border rounded-md overflow-hidden">
      <DataEditor
        getCellContent={getCellContent}
        columns={columns}
        rows={rows.length}
        onCellEdited={onCellEdited}
        key={editingKey}
        smoothScrollX
        smoothScrollY
        getCellsForSelection={true as any}
      />
    </div>
  )
}


