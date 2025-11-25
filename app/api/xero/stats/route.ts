// app/api/xero/stats/route.ts
// app/api/xero/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET(req: NextRequest) {
  const res = new NextResponse()
  const supabase = await getSupabaseServerClientFromRequest(req)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
  }

  // Fetch last connected from xero_auth_tokens
  const { data: tokenRow } = await supabase
    .from('xero_auth_tokens')
    .select('updated_at, tenant_id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch last sync from source_xero_invoices
  const { data: syncRow } = await supabase
    .from('source_xero_invoices')
    .select('synced_at')
    .eq('tenant_id', tokenRow?.tenant_id || '')
    .order('synced_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { count } = await supabase
    .from('source_xero_invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tokenRow?.tenant_id || '')

  return NextResponse.json({
    connected_clients: 1,
    total_invoices: count ?? 0,
    last_connected: tokenRow?.updated_at ?? null,
    last_synced: syncRow?.synced_at ?? null,
  })
}
