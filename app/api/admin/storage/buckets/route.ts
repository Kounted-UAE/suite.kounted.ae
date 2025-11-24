import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient()
    
    const { data, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('Error listing buckets:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ buckets: data || [] })
  } catch (error) {
    console.error('Error in buckets API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list buckets' },
      { status: 500 }
    )
  }
}

