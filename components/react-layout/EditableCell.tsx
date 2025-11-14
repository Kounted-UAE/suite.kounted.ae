'use client'

import React from "react"
import { TableCell } from "@/components/react-ui/table"
import { Button } from "@/components/react-ui/button"
import { cn } from "@/lib/utils"

type EditableCellType = "text" | "number" | "date" | "select"

export interface EditableCellProps extends React.ComponentProps<typeof TableCell> {
  value: string
  onSave: (nextValue: string) => void
  onCancel?: () => void
  renderDisplay?: (value: string) => React.ReactNode
  type?: EditableCellType
  options?: { label: string; value: string }[]
  disabled?: boolean
}

export function EditableCell({
  value,
  onSave,
  onCancel,
  renderDisplay,
  type = "text",
  options,
  disabled,
  className,
  ...props
}: EditableCellProps) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement | HTMLSelectElement | null>(null)

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

  React.useEffect(() => {
    if (!editing) {
      setDraft(value)
    }
  }, [value, editing])

  const beginEdit = React.useCallback(() => {
    if (disabled) return
    setEditing(true)
  }, [disabled])

  const cancelEdit = React.useCallback(() => {
    setDraft(value)
    setEditing(false)
    onCancel?.()
  }, [value, onCancel])

  const commitEdit = React.useCallback(() => {
    if (draft !== value) {
      onSave(draft)
    }
    setEditing(false)
  }, [draft, value, onSave])

  const renderEditor = () => {
    if (type === "select") {
      return (
        <select
          ref={(ref) => (inputRef.current = ref)}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          {(options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        ref={(ref) => (inputRef.current = ref)}
        type={type}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
      />
    )
  }

  return (
    <TableCell
      className={cn(
        "relative cursor-pointer align-middle text-sm text-slate-700 transition-colors hover:bg-slate-50",
        editing && "bg-white",
        className
      )}
      onDoubleClick={beginEdit}
      {...props}
    >
      {editing ? (
        <div className="flex items-center gap-2">
          <div className="flex-1">{renderEditor()}</div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={commitEdit}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <span>{renderDisplay ? renderDisplay(value) : value}</span>
      )}
    </TableCell>
  )
}

