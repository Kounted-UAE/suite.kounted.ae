import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function POST(req: NextRequest) {
  const res = new NextResponse()
  const supabase = await getSupabaseServerClientFromRequest(req)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('teamwork_connections')
    .update({
      access_token: '',
      refresh_token: null,
      token_expires_at: null,
      updated_at: now,
    })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

