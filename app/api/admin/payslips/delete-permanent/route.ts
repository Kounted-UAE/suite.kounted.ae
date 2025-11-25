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

    // Hard delete: Permanently remove records from database
    // Only delete records that are already soft-deleted (deleted_at IS NOT NULL)
    const { error } = await supabase
      .from('payroll_excel_imports')
      .delete()
      .in('id', ids)
      .not('deleted_at', 'is', null) // Only allow permanent delete of already soft-deleted records

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, deleted: ids.length })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

