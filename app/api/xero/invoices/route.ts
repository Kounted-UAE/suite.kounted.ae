// app/api/xero/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET(req: NextRequest) {
  const res = new NextResponse()
  const supabase = await getSupabaseServerClientFromRequest(req)

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
  }

  const { data: tenantRow, error: tenantError } = await supabase
    .from('xero_auth_tokens')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (tenantError || !tenantRow?.tenant_id) {
    return NextResponse.json({ error: 'No tenant configured' }, { status: 403 })
  }

  const { data: invoices, error } = await supabase
    .from('source_xero_invoices')
    .select('*')
    .eq('tenant_id', tenantRow.tenant_id)
    .order('synced_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to load invoices', details: error }, { status: 500 })
  }

  return NextResponse.json({ invoices })
}
