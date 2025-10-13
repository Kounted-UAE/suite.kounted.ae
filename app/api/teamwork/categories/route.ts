// app/api/teamwork/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'
import { getTeamworkProjectsAPI } from '@/lib/teamwork/projects'

// GET all categories
export async function GET(req: NextRequest) {
  try {
    const res = new NextResponse()
    const supabase = getSupabaseServerClientFromRequest(req, res)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const api = getTeamworkProjectsAPI()
    const result = await api.getCategories()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

