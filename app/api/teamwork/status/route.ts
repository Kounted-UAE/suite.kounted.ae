import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET(req: NextRequest) {
  const res = new NextResponse()
  const supabase = getSupabaseServerClientFromRequest(req, res)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('teamwork_connections')
    .select('id, email, name, token_expires_at, updated_at')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ connection: data ?? null })
}
