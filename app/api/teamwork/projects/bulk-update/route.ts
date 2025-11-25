// app/api/teamwork/projects/bulk-update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClientFromRequest } from '@/lib/supabase/server'
import { getTeamworkProjectsAPI } from '@/lib/teamwork/projects'

export const runtime = 'nodejs'


interface BulkUpdateItem {
  id: string
  updates: Record<string, any>
}

// POST bulk update multiple projects
export async function POST(req: NextRequest) {
  try {
    const res = new NextResponse()
    const supabase = await getSupabaseServerClientFromRequest(req)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const updates: BulkUpdateItem[] = body.updates

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Invalid updates array' }, { status: 400 })
    }

    const api = getTeamworkProjectsAPI()
    const results = {
      successful: [] as string[],
      failed: [] as { id: string, error: string }[]
    }

    // Process updates with a small delay to respect rate limits
    for (const item of updates) {
      try {
        await api.updateProject(item.id, item.updates)
        results.successful.push(item.id)
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        results.failed.push({
          id: item.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: results.failed.length === 0,
      results
    })
  } catch (error) {
    console.error('Error in bulk update:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform bulk update' },
      { status: 500 }
    )
  }
}

