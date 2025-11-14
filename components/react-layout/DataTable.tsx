'use client'

import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/react-ui/table"
import { Checkbox } from "@/components/react-ui/checkbox"
import { cn } from "@/lib/utils"

const SELECTION_COLUMN_WIDTH = 48

type SelectionMode = "none" | "multi"

interface DataTableContextValue {
  selectable: boolean
  selectionMode: SelectionMode
  isSelected: (rowId: string) => boolean
  toggleRow: (rowId: string) => void
  selectAll: (checked: boolean) => void
  stickyColumnWidth: number
  selectedRowIds: string[]
  rowCount: number
  selectionColumnWidth: number
}

const DataTableContext = React.createContext<DataTableContextValue | null>(null)

export function useDataTableContext() {
  const context = React.useContext(DataTableContext)
  if (!context) {
    throw new Error("useDataTableContext must be used within a DataTable")
  }
  return context
}

export interface DataTableProps {
  children: React.ReactNode
  selectable?: boolean
  selectedRows?: string[]
  defaultSelectedRows?: string[]
  onSelectionChange?: (rowIds: string[]) => void
  selectionMode?: SelectionMode
  stickyColumnWidth?: number
  className?: string
  containerClassName?: string
  footer?: React.ReactNode
  rowCount?: number
  allRowIds?: string[]
  selectionColumnWidth?: number
}

export function DataTable({
  children,
  selectable = false,
  selectedRows,
  defaultSelectedRows = [],
  onSelectionChange,
  selectionMode = "multi",
  stickyColumnWidth = 260,
  className,
  containerClassName,
  footer,
  rowCount,
  allRowIds,
  selectionColumnWidth = SELECTION_COLUMN_WIDTH,
}: DataTableProps) {
  const effectiveSelectionWidth = selectable ? selectionColumnWidth : 0
  const controlled = React.useMemo(() => selectedRows !== undefined, [selectedRows])
  const [internalSelected, setInternalSelected] = React.useState<Set<string>>(new Set(defaultSelectedRows))

  const selected = controlled ? new Set(selectedRows) : internalSelected

  const updateSelection = React.useCallback(
    (next: Set<string>) => {
      if (!controlled) {
        setInternalSelected(next)
      }
      onSelectionChange?.(Array.from(next))
    },
    [controlled, onSelectionChange]
  )

  const toggleRow = React.useCallback(
    (rowId: string) => {
      const next = new Set(selected)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        if (selectionMode === "multi") {
          next.add(rowId)
        } else {
          next.clear()
          next.add(rowId)
        }
      }
      updateSelection(next)
    },
    [selected, selectionMode, updateSelection]
  )

  const selectAll = React.useCallback(
    (checked: boolean) => {
      if (!selectable || selectionMode !== "multi" || !allRowIds) return
      const next = checked ? new Set(allRowIds) : new Set<string>()
      updateSelection(next)
    },
    [selectable, selectionMode, allRowIds, updateSelection]
  )

  const contextValue = React.useMemo<DataTableContextValue>(
    () => ({
      selectable,
      selectionMode,
      isSelected: (rowId: string) => selected.has(rowId),
      toggleRow,
      selectAll,
      stickyColumnWidth,
      selectedRowIds: Array.from(selected),
      rowCount: rowCount ?? (allRowIds ? allRowIds.length : 0),
      selectionColumnWidth: effectiveSelectionWidth,
    }),
    [
      selectable,
      selectionMode,
      selected,
      toggleRow,
      selectAll,
      stickyColumnWidth,
      rowCount,
      allRowIds,
      effectiveSelectionWidth,
    ]
  )

  return (
    <DataTableContext.Provider value={contextValue}>
      <div className="suite-data-table space-y-3">
        <Table
          className={className}
          containerClassName={cn(
            "relative max-h-[65vh] overflow-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm",
            containerClassName
          )}
          stickyHeader
        >
          {children}
        </Table>
        {footer ? <div className="suite-data-table__footer">{footer}</div> : null}
      </div>
    </DataTableContext.Provider>
  )
}

export interface DataTableHeaderCheckboxProps
  extends React.ComponentProps<typeof Checkbox> {
  indeterminate?: boolean
}

export function DataTableHeaderCheckbox({ className, ...props }: DataTableHeaderCheckboxProps) {
  const { selectable, selectedRowIds, rowCount, selectAll, selectionMode } =
    useDataTableContext()
  if (!selectable || selectionMode !== "multi") {
    return null
  }

  const allSelected = rowCount > 0 && selectedRowIds.length === rowCount
  const indeterminate = selectedRowIds.length > 0 && !allSelected

  return (
    <Checkbox
      data-testid="datatable-header-checkbox"
      className={cn(
        "h-4 w-4 rounded-sm border-slate-500 data-[state=checked]:bg-slate-600",
        className
      )}
      checked={allSelected}
      indeterminate={indeterminate}
      onCheckedChange={(checked) => selectAll(checked === true)}
      {...props}
    />
  )
}

export interface DataTableCheckboxCellProps {
  rowId: string
  className?: string
}

export function DataTableCheckboxCell({ rowId, className }: DataTableCheckboxCellProps) {
  const { isSelected, toggleRow, selectionColumnWidth } = useDataTableContext()

  return (
    <TableCell
      className={cn(
        "sticky left-0 top-0 z-40 align-middle bg-white px-0 shadow-[inset_-1px_0_0_rgba(15,23,42,0.08)]",
        className
      )}
      style={{
        width: selectionColumnWidth,
        minWidth: selectionColumnWidth,
        maxWidth: selectionColumnWidth,
      }}
    >
      <div className="flex h-full items-center justify-center">
        <Checkbox
          checked={isSelected(rowId)}
          onCheckedChange={() => toggleRow(rowId)}
          aria-label="Select row"
        />
      </div>
    </TableCell>
  )
}

export function DataTableSelectionHeadCell({ className }: { className?: string }) {
  const { selectionColumnWidth, selectable, selectionMode } = useDataTableContext()

  if (!selectable) {
    return null
  }

  return (
    <TableHead
      className={cn(
        "sticky left-0 top-0 z-50 bg-white px-0 align-middle shadow-[inset_-1px_0_0_rgba(15,23,42,0.08)]",
        className
      )}
      style={{
        width: selectionColumnWidth,
        minWidth: selectionColumnWidth,
        maxWidth: selectionColumnWidth,
      }}
    >
      <div className="flex h-12 items-center justify-center">
        {selectionMode === "multi" ? <DataTableHeaderCheckbox /> : null}
      </div>
    </TableHead>
  )
}

export interface DataTableRowProps extends React.ComponentProps<typeof TableRow> {
  rowId: string
}

export function DataTableRow({ rowId, className, ...props }: DataTableRowProps) {
  const { isSelected, toggleRow, selectable } = useDataTableContext()
  const selected = selectable && isSelected(rowId)

  return (
    <TableRow
      data-selected={selected || undefined}
      className={cn(
        "cursor-default transition-colors hover:bg-slate-50 aria-selected:bg-slate-50 data-[selected=true]:bg-slate-100",
        className
      )}
      onClick={(event) => {
        if (!selectable) return
        const target = event.target as HTMLElement
        if (target.closest("button, a, input, label")) {
          return
        }
        toggleRow(rowId)
      }}
      {...props}
    />
  )
}

export interface StickyHeadCellProps extends React.ComponentProps<typeof TableHead> {
  offset?: number
}

export function StickyHeadCell({ className, style, offset = 0, ...props }: StickyHeadCellProps) {
  const { stickyColumnWidth, selectionColumnWidth } = useDataTableContext()
  const calculatedLeft = selectionColumnWidth + offset
  return (
    <TableHead
      className={cn(
        "sticky z-40 min-w-[var(--sticky-column-width)] bg-slate-100 text-slate-600 shadow-[inset_-1px_0_0_rgba(15,23,42,0.08)]",
        className
      )}
      style={{
        ...(style ?? {}),
        minWidth: `max(${stickyColumnWidth}px, 12rem)`,
        left: calculatedLeft,
      }}
      {...props}
    />
  )
}

export interface StickyCellProps extends React.ComponentProps<typeof TableCell> {
  offset?: number
}

export function StickyCell({ className, style, offset = 0, ...props }: StickyCellProps) {
  const { stickyColumnWidth, selectionColumnWidth } = useDataTableContext()
  const calculatedLeft = selectionColumnWidth + offset
  return (
    <TableCell
      className={cn(
        "sticky z-30 bg-slate-50 font-semibold text-slate-900 shadow-[inset_-1px_0_0_rgba(15,23,42,0.1)]",
        className
      )}
      style={{
        ...(style ?? {}),
        minWidth: `max(${stickyColumnWidth}px, 12rem)`,
        left: calculatedLeft,
      }}
      {...props}
    />
  )
}

export {
  TableHeader as DataTableHeader,
  TableBody as DataTableBody,
  TableHead as DataTableHead,
  TableRow as BaseTableRow,
  TableCell as BaseTableCell,
}

