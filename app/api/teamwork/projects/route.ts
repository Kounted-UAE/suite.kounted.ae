// app/api/teamwork/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'
import { getTeamworkProjectsAPI } from '@/lib/teamwork/projects'

// GET all projects

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const res = new NextResponse()
    const supabase = getSupabaseServerClientFromRequest(req, res)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as 'active' | 'archived' | 'all' | null
    const page = searchParams.get('page')
    const pageSize = searchParams.get('pageSize')

    const api = getTeamworkProjectsAPI()
    const result = await api.getAllProjects({
      status: status || 'active',
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : 500
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

