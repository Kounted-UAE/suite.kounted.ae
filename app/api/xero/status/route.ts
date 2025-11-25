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

  const { data: tokenRow } = await supabase
    .from('xero_auth_tokens')
    .select('tenant_id, tenant_name, updated_at, expires_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { count: invoiceCount } = await supabase
    .from('source_xero_invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tokenRow?.tenant_id || '')

  return NextResponse.json({
    tenant_id: tokenRow?.tenant_id ?? null,
    tenant_name: tokenRow?.tenant_name ?? null,
    token_updated_at: tokenRow?.updated_at ?? null,
    token_expires_at: tokenRow?.expires_at ?? null,
    invoice_count: invoiceCount ?? 0,
  })
}
