// app/api/employers/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase
      .from('employers')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServiceClient()
    const body = await req.json()
    
    // Validate required fields
    if (!body.name || !body.reviewer_email) {
      return NextResponse.json(
        { error: 'Missing required fields: name, reviewer_email' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('employers')
      .insert({
        name: body.name,
        reviewer_email: body.reviewer_email
      })
      .select('*')
      .single()
      
    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Employer with this name already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}
