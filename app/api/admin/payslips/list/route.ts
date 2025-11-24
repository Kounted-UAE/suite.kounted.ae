import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServiceClient()

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || '200')
    const offset = Number(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || ''
    const sortDir = (searchParams.get('sortDir') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
    const search = (searchParams.get('search') || '').trim()
    const employersCsv = (searchParams.get('employers') || '').trim()
    const datesCsv = (searchParams.get('dates') || '').trim()
    const currencyCsv = (searchParams.get('currency') || '').trim()

    const fromIdx = offset
    const toIdx = offset + limit - 1

    // Whitelist sortable columns to avoid SQL injection
    const sortable: Record<string, true> = {
      created_at: true,
      pay_period_to: true,
      employer_name: true,
      employee_name: true,
      reviewer_email: true,
      email_id: true,
      currency: true,
      net_salary: true,
      esop_deductions: true,
      total_payment_adjustments: true,
      net_payment: true,
    }

    // Check if we should include deleted records (for viewing deleted items)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    
    let query = supabase
      .from('payroll_excel_imports')
      .select('*', { count: 'exact' })
    
    // Only filter out deleted records if we're not explicitly including them
    // Note: If deleted_at column doesn't exist (migration not run), this will cause an error
    // The error will be caught below and returned to the client
    try {
      if (!includeDeleted) {
        query = query.is('deleted_at', null) // Exclude soft-deleted records
      } else {
        // Only show deleted records
        query = query.not('deleted_at', 'is', null)
      }
    } catch (e) {
      // If column doesn't exist, continue without filter (backwards compatibility)
      console.warn('deleted_at column may not exist, skipping soft-delete filter')
    }
    
    query = query.range(fromIdx, toIdx)

    // Filters
    if (search) {
      // OR search across text columns
      query = query.or(
        [
          `employee_name.ilike.%${search}%`,
          `employer_name.ilike.%${search}%`,
          `reviewer_email.ilike.%${search}%`,
          `email_id.ilike.%${search}%`,
        ].join(',')
      )
    }

    if (employersCsv) {
      const employers = employersCsv.split(',').map(s => s.trim()).filter(Boolean)
      if (employers.length) {
        query = query.in('employer_name', employers)
      }
    }

    if (datesCsv) {
      const dates = datesCsv.split(',').map(s => s.trim()).filter(Boolean)
      if (dates.length) {
        query = query.in('pay_period_to', dates)
      }
    }

    if (currencyCsv) {
      const currencies = currencyCsv.split(',').map(s => s.trim()).filter(Boolean)
      if (currencies.length) {
        query = query.in('currency', currencies)
      }
    }

    if (sortBy && sortable[sortBy]) {
      query = query.order(sortBy, { ascending: sortDir === 'asc', nullsFirst: sortDir === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error, count } = await query

    if (error) {
      // If error mentions deleted_at column, it might not exist yet
      if (error.message?.includes('deleted_at') || error.message?.includes('column')) {
        console.warn('Query error (possibly missing deleted_at column):', error.message)
        // Try query without deleted_at filter for backwards compatibility
        let fallbackQuery = supabase
          .from('payroll_excel_imports')
          .select('*', { count: 'exact' })
          .range(fromIdx, toIdx)
        
        // Reapply other filters
        if (search) {
          fallbackQuery = fallbackQuery.or(
            [
              `employee_name.ilike.%${search}%`,
              `employer_name.ilike.%${search}%`,
              `reviewer_email.ilike.%${search}%`,
              `email_id.ilike.%${search}%`,
            ].join(',')
          )
        }
        if (employersCsv) {
          const employers = employersCsv.split(',').map(s => s.trim()).filter(Boolean)
          if (employers.length) {
            fallbackQuery = fallbackQuery.in('employer_name', employers)
          }
        }
        if (datesCsv) {
          const dates = datesCsv.split(',').map(s => s.trim()).filter(Boolean)
          if (dates.length) {
            fallbackQuery = fallbackQuery.in('pay_period_to', dates)
          }
        }
        if (currencyCsv) {
          const currencies = currencyCsv.split(',').map(s => s.trim()).filter(Boolean)
          if (currencies.length) {
            fallbackQuery = fallbackQuery.in('currency', currencies)
          }
        }
        if (sortBy && sortable[sortBy]) {
          fallbackQuery = fallbackQuery.order(sortBy, { ascending: sortDir === 'asc', nullsFirst: sortDir === 'asc' })
        } else {
          fallbackQuery = fallbackQuery.order('created_at', { ascending: false })
        }
        
        const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery
        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 })
        }
        // Use fallback results
        const rowsWithBatchId = (fallbackData || []).map((r: any) => ({ 
          ...r, 
          batch_id: r.id
        }))
        
        // Attach email send event data for fallback results too
        let fallbackLastSentMap: Record<string, {
          last_sent_at: string | null
          delivery_status: string | null
          delivery_status_updated_at: string | null
          resend_email_id: string | null
        }> = {}
        try {
          const fallbackIds = (fallbackData || []).map((r: any) => r.id).filter(Boolean)
          if (fallbackIds.length > 0) {
            const { data: fallbackEvents, error: fallbackEventsError } = await supabase
              .from('payroll_payslip_send_events')
              .select('batch_id, created_at, delivery_status, delivery_status_updated_at, resend_email_id')
              .in('batch_id', fallbackIds)
              .order('created_at', { ascending: false })

            if (!fallbackEventsError && Array.isArray(fallbackEvents)) {
              for (const e of fallbackEvents) {
                if (!fallbackLastSentMap[e.batch_id]) {
                  const statusTimestamp = e.delivery_status_updated_at || e.created_at
                  fallbackLastSentMap[e.batch_id] = {
                    last_sent_at: e.created_at,
                    delivery_status: e.delivery_status || null,
                    delivery_status_updated_at: statusTimestamp,
                    resend_email_id: e.resend_email_id || null,
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Error fetching send events for fallback:', e)
        }
        
        const fallbackRowsWithLast = rowsWithBatchId.map((r: any) => {
          const eventData = fallbackLastSentMap[r.id] || {
            last_sent_at: null,
            delivery_status: null,
            delivery_status_updated_at: null,
            resend_email_id: null,
          }
          return {
            ...r,
            last_sent_at: eventData.last_sent_at,
            delivery_status: eventData.delivery_status,
            delivery_status_updated_at: eventData.delivery_status_updated_at,
            resend_email_id: eventData.resend_email_id,
          }
        })
        
        return NextResponse.json({ rows: fallbackRowsWithLast, total: fallbackCount ?? 0 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map id to batch_id for backward compatibility with frontend
    const rowsWithBatchId = (data || []).map((r: any) => ({ 
      ...r, 
      batch_id: r.id  // Map id to batch_id for frontend compatibility
    }))

    // Attach email send event data from events table (best-effort)
    // This includes last_sent_at, delivery_status, and delivery_status_updated_at
    let lastSentMap: Record<string, {
      last_sent_at: string | null
      delivery_status: string | null
      delivery_status_updated_at: string | null
      resend_email_id: string | null
    }> = {}
    try {
      const ids = (data || []).map((r: any) => r.id).filter(Boolean)
      if (ids.length > 0) {
        const { data: events, error: eventsError } = await supabase
          .from('payroll_payslip_send_events')
          .select('batch_id, created_at, delivery_status, delivery_status_updated_at, resend_email_id')
          .in('batch_id', ids)
          .order('created_at', { ascending: false })

        if (!eventsError && Array.isArray(events)) {
          for (const e of events) {
            if (!lastSentMap[e.batch_id]) {
              // Use delivery_status_updated_at if available, otherwise use created_at
              const statusTimestamp = e.delivery_status_updated_at || e.created_at
              lastSentMap[e.batch_id] = {
                last_sent_at: e.created_at,
                delivery_status: e.delivery_status || null,
                delivery_status_updated_at: statusTimestamp,
                resend_email_id: e.resend_email_id || null,
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching send events:', e)
    }

    const rowsWithLast = rowsWithBatchId.map((r: any) => {
      const eventData = lastSentMap[r.id] || {
        last_sent_at: null,
        delivery_status: null,
        delivery_status_updated_at: null,
        resend_email_id: null,
      }
      return {
        ...r,
        last_sent_at: eventData.last_sent_at,
        delivery_status: eventData.delivery_status,
        delivery_status_updated_at: eventData.delivery_status_updated_at,
        resend_email_id: eventData.resend_email_id,
      }
    })

    return NextResponse.json({ rows: rowsWithLast, total: count ?? 0 })
  } catch (error) {
    console.error('Error in payslips list API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
