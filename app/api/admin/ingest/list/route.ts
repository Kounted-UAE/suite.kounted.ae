import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'
import type { IngestSortableField } from '@/lib/types/payrollIngest'

export const runtime = 'nodejs'


export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServiceClient()
    const { searchParams } = new URL(request.url)

    const limit = Number(searchParams.get('limit') || '200')
    const offset = Number(searchParams.get('offset') || '0')
    const sortBy = (searchParams.get('sortBy') || 'created_at') as IngestSortableField
    const sortDir = (searchParams.get('sortDir') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
    const search = (searchParams.get('search') || '').trim()
    const employersCsv = (searchParams.get('employers') || '').trim()
    const currencyCsv = (searchParams.get('currency') || '').trim()
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const fromIdx = offset
    const toIdx = offset + limit - 1

    const sortable: Record<string, true> = {
      created_at: true,
      pay_period_to: true,
      employer_name: true,
      employee_name: true,
      currency: true,
      net_salary: true,
      esop_deductions: true,
      total_payment_adjustments: true,
      net_payment: true,
      total_to_transfer: true,
    }

    let query = supabase
      .from('payroll_excel_imports')
      .select('*', { count: 'exact' })
      .range(fromIdx, toIdx)

    // Filters
    if (search) {
      // OR search across a few text columns
      query = query.or(
        [
          `employee_name.ilike.%${search}%`,
          `employer_name.ilike.%${search}%`,
          `reviewer_email.ilike.%${search}%`,
          `email_id.ilike.%${search}%`,
          `iban.ilike.%${search}%`,
        ].join(',')
      )
    }

    if (employersCsv) {
      const employers = employersCsv.split(',').map(s => s.trim()).filter(Boolean)
      if (employers.length) {
        query = query.in('employer_name', employers)
      }
    }

    if (currencyCsv) {
      const currencies = currencyCsv.split(',').map(s => s.trim()).filter(Boolean)
      if (currencies.length) {
        query = query.in('currency', currencies)
      }
    }

    if (from) {
      query = query.gte('pay_period_from', from)
    }
    if (to) {
      query = query.lte('pay_period_to', to)
    }

    if (sortBy && sortable[sortBy]) {
      query = query.order(sortBy, { ascending: sortDir === 'asc', nullsFirst: sortDir === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rows: data || [], total: count ?? 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}


