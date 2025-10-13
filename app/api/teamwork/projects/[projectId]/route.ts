// app/api/teamwork/projects/[projectId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'
import { getTeamworkProjectsAPI } from '@/lib/teamwork/projects'

// GET a single project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const res = new NextResponse()
    const supabase = getSupabaseServerClientFromRequest(req, res)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const api = getTeamworkProjectsAPI()
    const result = await api.getProject(projectId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PUT update a project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const res = new NextResponse()
    const supabase = getSupabaseServerClientFromRequest(req, res)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const body = await req.json()
    const api = getTeamworkProjectsAPI()
    
    await api.updateProject(projectId, body)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update project' },
      { status: 500 }
    )
  }
}

