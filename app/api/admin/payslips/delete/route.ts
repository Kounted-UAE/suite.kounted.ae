import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServiceClient()
    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids : []

    if (!ids.length) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    // Soft delete: Set deleted_at timestamp instead of hard deleting
    const deletedAt = new Date().toISOString()
    const { data, error } = await supabase
      .from('payroll_excel_imports')
      .update({ deleted_at: deletedAt })
      .in('id', ids)
      .select('id')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, deleted: ids.length, ids: data?.map(r => r.id) || ids })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}



