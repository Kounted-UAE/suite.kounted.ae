import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServiceClient()
    const { searchParams } = new URL(request.url)

    const limit = Number(searchParams.get('limit') || '50')
    const offset = Number(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'closed_at'
    const sortDir = (searchParams.get('sortDir') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
    const batchId = searchParams.get('batch_id')

    const fromIdx = offset
    const toIdx = offset + limit - 1

    const sortable: Record<string, true> = {
      closed_at: true,
      pay_period_to: true,
      employer_name: true,
      employee_name: true,
      currency: true,
      net_salary: true,
      total_to_transfer: true,
    }

    let query = supabase
      .from('payroll_historical_payruns')
      .select('*', { count: 'exact' })
      .range(fromIdx, toIdx)

    // Filter by batch ID if provided
    if (batchId) {
      query = query.eq('closure_batch_id', batchId)
    }

    if (sortBy && sortable[sortBy]) {
      query = query.order(sortBy, { ascending: sortDir === 'asc', nullsFirst: sortDir === 'asc' })
    } else {
      query = query.order('closed_at', { ascending: false })
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rows: data || [], total: count ?? 0 })
  } catch (error: any) {
    console.error('Error fetching historical payruns:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

