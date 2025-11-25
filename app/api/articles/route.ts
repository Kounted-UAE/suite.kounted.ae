// app/api/articles/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET() {
  try {
    const supabase = await getSupabaseServiceClient()
    const { data, error } = await supabase.from('articles' as any).select('*').order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServiceClient()
    const body = await req.json().catch(() => ({}))
    const { data, error } = await supabase.from('articles' as any).insert(body).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

