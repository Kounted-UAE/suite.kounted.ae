import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'
import { xero } from '@/lib/xero/xero'

export const runtime = 'nodejs'


export async function GET(req: NextRequest) {
  const res = new NextResponse()
  const supabase = await getSupabaseServerClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const state = encodeURIComponent(JSON.stringify({ user_id: user.id }))
  const consentUrl = xero.buildConsentUrl()
  return NextResponse.redirect(`${consentUrl}&state=${state}`)
}
