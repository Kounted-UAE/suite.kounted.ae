import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServiceClient()
    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids : []

    if (!ids.length) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    // Restore: Set deleted_at back to NULL
    const { data, error } = await supabase
      .from('payroll_excel_imports')
      .update({ deleted_at: null })
      .in('id', ids)
      .select('id')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, restored: ids.length, ids: data?.map(r => r.id) || ids })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}


