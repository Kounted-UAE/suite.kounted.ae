// app/api/teamwork/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'
import { getTeamworkProjectsAPI } from '@/lib/teamwork/projects'

// GET all categories

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const res = new NextResponse()
    const supabase = await getSupabaseServerClientFromRequest(req)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const api = getTeamworkProjectsAPI()
    const result = await api.getCategories()

    console.log('Categories API result:', result)
    console.log('Categories count:', result?.categories?.length || 0)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

