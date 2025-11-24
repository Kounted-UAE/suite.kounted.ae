import { NextRequest, NextResponse } from 'next/server'
import { xero } from '@/lib/xero/xero'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET(req: NextRequest) {
  const res = new NextResponse()

  try {
    const supabase = getSupabaseServerClientFromRequest(req, res)

    const stateRaw = req.nextUrl.searchParams.get('state')
    const state = stateRaw ? JSON.parse(decodeURIComponent(stateRaw)) : null
    const userId = state?.user_id

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id in state' }, { status: 400 })
    }

    await xero.apiCallback(req.nextUrl.href)
    await xero.updateTenants()

    const tokenSet = xero.readTokenSet()
    const tenant = xero.tenants?.[0]

    if (!tenant?.tenantId) {
      return NextResponse.json({ error: 'Tenant missing in Xero response' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const expiresAt = tokenSet.expires_in
      ? new Date(Date.now() + tokenSet.expires_in * 1000).toISOString()
      : null

    const { error: tokenError } = await supabase.from('xero_auth_tokens').upsert(
      {
        user_id: userId,
        tenant_id: tenant.tenantId,
        tenant_name: tenant.tenantName,
        access_token: tokenSet.access_token,
        refresh_token: tokenSet.refresh_token,
        expires_at: expiresAt,
        created_date_utc: tenant.createdDateUtc,
        expires_in_seconds: tokenSet.expires_in,
        updated_at: now,
        created_at: now,
      },
      { onConflict: 'tenant_id' }
    )

    const { error: tenantError } = await supabase.from('xero_tenants').upsert(
      {
        user_id: userId,
        tenant_id: tenant.tenantId,
        tenant_name: tenant.tenantName,
        created_date_utc: tenant.createdDateUtc,
      },
      { onConflict: 'tenant_id' }
    )

    await supabase.from('xero_sync_logs').insert({
      user_id: userId,
      tenant_id: tenant.tenantId,
      type: 'token',
      status: tokenError || tenantError ? 'failed' : 'success',
      entity_type: 'auth',
      sync_started_at: now,
      sync_completed_at: now,
      records_synced: 0,
      errors_count: tokenError || tenantError ? 1 : 0,
      error_details: tokenError || tenantError
        ? { message: (tokenError || tenantError)?.message ?? 'Unknown error' }
        : null,
    })

    if (tokenError || tenantError) {
      return NextResponse.json({ error: 'Token or tenant save failed' }, { status: 500 })
    }

    return NextResponse.redirect(`${req.nextUrl.origin}/suite/admin/xero-config`)
  } catch (err: any) {
    console.error('❌ Xero callback failed:', err)
    return NextResponse.json({ error: 'Xero callback crashed', message: err.message }, { status: 500 })
  }
}
