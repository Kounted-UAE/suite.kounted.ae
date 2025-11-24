// app/api/xero/sync/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { xero } from '@/lib/xero/xero'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET(req: NextRequest) {
  const res = new NextResponse()
  try {
    const supabase = getSupabaseServerClientFromRequest(req, res)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (!user || userError) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { data: tokenRow, error: tokenError } = await supabase
      .from('xero_auth_tokens')
      .select('access_token, refresh_token, tenant_id')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenRow?.tenant_id) {
      return NextResponse.json({ error: 'No valid Xero token or tenant ID found' }, { status: 403 })
    }

    await xero.setTokenSet({
      access_token: tokenRow.access_token ?? '',
      refresh_token: tokenRow.refresh_token ?? '',
      expires_at: 0,
    })
    await xero.updateTenants()

    const tenantId = tokenRow.tenant_id
    const { body } = await xero.accountingApi.getContacts(tenantId)
    const contacts = body.contacts ?? []

    const now = new Date().toISOString()
    const mapped = contacts.map((c: any) => ({
      id: c.contactID,
      AccountNumber: c.accountNumber ?? null,
      ContactName: c.name ?? null,
      EmailAddress: c.emailAddress ?? null,
      FirstName: c.firstName ?? null,
      LastName: c.lastName ?? null,
      synced_at: now,
      source_data: c,
    }))

    const { error: upsertError } = await supabase
      .from('source_xero_contacts')
      .upsert(mapped, { onConflict: 'id' })

    if (upsertError) {
      console.error('❌ Upsert contacts failed:', upsertError)
      return NextResponse.json({ error: 'Insert failed', details: upsertError }, { status: 500 })
    }

    // Persist refreshed tokens (if any)
    try {
      const tokenSet = xero.readTokenSet()
      const expiresAt = tokenSet.expires_in
        ? new Date(Date.now() + tokenSet.expires_in * 1000).toISOString()
        : null
      await supabase
        .from('xero_auth_tokens')
        .upsert(
          {
            user_id: user.id,
            tenant_id: tenantId,
            access_token: tokenSet.access_token ?? tokenRow.access_token ?? null,
            refresh_token: tokenSet.refresh_token ?? tokenRow.refresh_token ?? null,
            expires_in_seconds: tokenSet.expires_in ?? null,
            expires_at: expiresAt,
            updated_at: now,
          },
          { onConflict: 'tenant_id' }
        )
    } catch (e) {
      console.error('⚠️ Failed to persist refreshed Xero tokens (contacts):', e)
    }

    return NextResponse.json({ success: true, count: mapped.length })
  } catch (err: any) {
    console.error('❌ Contacts sync error:', err)
    return NextResponse.json({ error: 'Unexpected error', message: err.message }, { status: 500 })
  }
}
