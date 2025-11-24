import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'
import { TEAMWORK_CLIENT_ID, TEAMWORK_CLIENT_SECRET, TEAMWORK_TOKEN_URL } from '@/lib/teamwork/client'

export const runtime = 'nodejs'


export async function POST(req: NextRequest) {
  const res = new NextResponse()
  const supabase = getSupabaseServerClientFromRequest(req, res)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conn } = await supabase
    .from('teamwork_connections')
    .select('refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()

  const refreshToken = conn?.refresh_token
  if (!refreshToken) return NextResponse.json({ error: 'No refresh token' }, { status: 400 })

  const body = new URLSearchParams()
  body.set('grant_type', 'refresh_token')
  body.set('refresh_token', refreshToken)
  body.set('client_id', TEAMWORK_CLIENT_ID)
  body.set('client_secret', TEAMWORK_CLIENT_SECRET)

  const originToSend = req.nextUrl.origin
  const resp = await fetch(TEAMWORK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Origin': originToSend,
    },
    body: body.toString(),
  })
  if (!resp.ok) {
    const text = await resp.text()
    console.error('Teamwork token refresh failed:', resp.status, text, 'origin:', originToSend)
    return NextResponse.json({ error: 'refresh_failed' }, { status: 500 })
  }
  const tokenJson: any = await resp.json()
  const accessToken: string | null = tokenJson.access_token ?? null
  const newRefreshToken: string | null = tokenJson.refresh_token ?? refreshToken
  const expiresIn: number | null = tokenJson.expires_in ?? null
  const now = new Date()
  const expiresAt = expiresIn ? new Date(now.getTime() + expiresIn * 1000).toISOString() : null

  await supabase
    .from('teamwork_connections')
    .update({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_expires_at: expiresAt,
      updated_at: now.toISOString(),
    })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
