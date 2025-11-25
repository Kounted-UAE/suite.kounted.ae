import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'
import { dateFields, editableTextFields, numericFields } from '@/lib/types/payrollIngest'

export const runtime = 'nodejs'


const editableSet = new Set<string>([
  ...editableTextFields,
  ...dateFields,
  ...numericFields,
].map(String))

function coerceValue(key: string, value: any) {
  if (numericFields.includes(key as any)) {
    if (value === null || value === '' || value === undefined) return null
    const n = Number(String(value).replace(/[, ]/g, ''))
    return Number.isFinite(n) ? n : null
  }
  if (dateFields.includes(key as any)) {
    if (!value) return null
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString().slice(0, 10)
  }
  // text fields
  if (value === undefined) return null
  return String(value)
}

export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseServiceClient()
    const { id, changes } = await request.json().catch(() => ({ id: null, changes: {} }))

    if (!id || typeof changes !== 'object') {
      return NextResponse.json({ error: 'id and changes required' }, { status: 400 })
    }

    // Whitelist and coerce
    const update: Record<string, any> = {}
    for (const [k, v] of Object.entries(changes)) {
      if (!editableSet.has(k)) continue
      update[k] = coerceValue(k, v)
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('payroll_excel_imports')
      .update(update)
      .eq('id', id)
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ row: (data || [])[0] || null })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}


