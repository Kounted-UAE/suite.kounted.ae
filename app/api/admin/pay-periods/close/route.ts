import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { PayPeriodClosureRequest, PayPeriodClosureSummary } from '@/lib/types/payrollIngest'

export const runtime = 'nodejs'


export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    
    // Verify user authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (!user || userError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body: PayPeriodClosureRequest = await request.json()
    const { period_end_dates, notes } = body

    if (!period_end_dates || period_end_dates.length === 0) {
      return NextResponse.json({ error: 'No pay periods selected for closure' }, { status: 400 })
    }

    // Generate a unique batch ID for this closure operation
    const closureBatchId = crypto.randomUUID()
    
    // Start a transaction to move records
    const recordsByPeriod: { [period_end_date: string]: number } = {}
    let totalRecordsMoved = 0

    for (const periodEndDate of period_end_dates) {
      // Get records for this pay period
      const { data: recordsToMove, error: fetchError } = await supabase
        .from('payroll_excel_imports')
        .select('*')
        .eq('pay_period_to', periodEndDate)

      if (fetchError) {
        throw new Error(`Failed to fetch records for period ${periodEndDate}: ${fetchError.message}`)
      }

      if (!recordsToMove || recordsToMove.length === 0) {
        recordsByPeriod[periodEndDate] = 0
        continue
      }

      // Prepare historical records with closure metadata
      const historicalRecords = recordsToMove.map(record => ({
        ...record,
        id: crypto.randomUUID(), // New ID for historical table
        original_id: record.id,   // Keep reference to original
        closed_at: new Date().toISOString(),
        closed_by_user_id: user.id,
        closure_batch_id: closureBatchId,
        closure_notes: notes || null
      }))

      // Insert into historical table
      const { error: insertError } = await supabase
        .from('payroll_historical_payruns')
        .insert(historicalRecords)

      if (insertError) {
        throw new Error(`Failed to insert historical records for period ${periodEndDate}: ${insertError.message}`)
      }

      // Delete from active table
      const { error: deleteError } = await supabase
        .from('payroll_excel_imports')
        .delete()
        .eq('pay_period_to', periodEndDate)

      if (deleteError) {
        throw new Error(`Failed to delete active records for period ${periodEndDate}: ${deleteError.message}`)
      }

      recordsByPeriod[periodEndDate] = recordsToMove.length
      totalRecordsMoved += recordsToMove.length
    }

    const closureSummary: PayPeriodClosureSummary = {
      closure_batch_id: closureBatchId,
      period_end_dates,
      total_records_moved: totalRecordsMoved,
      records_by_period: recordsByPeriod,
      closed_at: new Date().toISOString(),
      notes
    }

    return NextResponse.json({ 
      success: true, 
      summary: closureSummary
    })

  } catch (error: any) {
    console.error('Error closing pay periods:', error)
    return NextResponse.json({ 
      error: error?.message || 'Internal server error closing pay periods' 
    }, { status: 500 })
  }
}
