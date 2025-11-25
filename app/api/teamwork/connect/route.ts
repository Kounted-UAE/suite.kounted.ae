import { NextRequest, NextResponse } from 'next/server'
import { buildTeamworkAuthorizeUrl } from '@/lib/teamwork/client'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET(req: NextRequest) {
  const res = new NextResponse()
  const supabase = await getSupabaseServerClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const state = encodeURIComponent(JSON.stringify({ user_id: user.id }))
  const url = buildTeamworkAuthorizeUrl(state)
  return NextResponse.redirect(url)
}
