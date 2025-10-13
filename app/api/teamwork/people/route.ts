// app/api/teamwork/people/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'
import { getTeamworkProjectsAPI } from '@/lib/teamwork/projects'

// GET all people
export async function GET(req: NextRequest) {
  try {
    const res = new NextResponse()
    const supabase = getSupabaseServerClientFromRequest(req, res)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const api = getTeamworkProjectsAPI()
    const result = await api.getPeople()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching people:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch people' },
      { status: 500 }
    )
  }
}

