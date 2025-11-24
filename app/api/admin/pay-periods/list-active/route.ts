import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServiceClient()

    // Get unique pay periods from the payroll_excel_imports table
    // Group by pay_period_to and aggregate information
    console.log('Fetching active pay periods from payroll_excel_imports...')
    const { data: payPeriods, error } = await supabase
      .from('payroll_excel_imports')
      .select('pay_period_to, employer_name, currency, net_salary, net_payment')
      .order('pay_period_to', { ascending: false })

    console.log('Pay periods query result:', { 
      count: payPeriods?.length || 0, 
      error: error?.message,
      sample: payPeriods?.[0] 
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group and aggregate the data
    const periodsMap = new Map<string, {
      pay_period_to: string
      record_count: number
      employers: Set<string>
      total_amount: number
      currency_breakdown: { [currency: string]: number }
    }>()

    for (const record of payPeriods || []) {
      const periodKey = record.pay_period_to
      const existing = periodsMap.get(periodKey)
      
      if (existing) {
        existing.record_count += 1
        existing.employers.add(record.employer_name)
        existing.total_amount += Number(record.net_payment || record.net_salary || 0)
        
        const currency = record.currency || 'AED'
        existing.currency_breakdown[currency] = (existing.currency_breakdown[currency] || 0) + Number(record.net_payment || record.net_salary || 0)
      } else {
        periodsMap.set(periodKey, {
          pay_period_to: record.pay_period_to,
          record_count: 1,
          employers: new Set([record.employer_name]),
          total_amount: Number(record.net_payment || record.net_salary || 0),
          currency_breakdown: {
            [record.currency || 'AED']: Number(record.net_payment || record.net_salary || 0)
          }
        })
      }
    }

    // Convert to final format
    const uniquePeriods = Array.from(periodsMap.values()).map(period => ({
      pay_period_to: period.pay_period_to,
      record_count: period.record_count,
      employers: Array.from(period.employers),
      total_amount: period.total_amount,
      currency_breakdown: period.currency_breakdown
    }))

    console.log('Processed unique periods:', {
      totalPeriods: uniquePeriods.length,
      periods: uniquePeriods.map(p => ({ date: p.pay_period_to, count: p.record_count }))
    })

    return NextResponse.json({ periods: uniquePeriods })
  } catch (error: any) {
    console.error('Error fetching active pay periods:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

