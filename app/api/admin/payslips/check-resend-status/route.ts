import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { emailIds, batchIds } = await req.json()

    if (!emailIds && !batchIds) {
      return NextResponse.json(
        { error: 'Either emailIds or batchIds must be provided' },
        { status: 400 }
      )
    }

    const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL
    const keyEnv = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!urlEnv || !keyEnv) {
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(urlEnv, keyEnv)

    // If batchIds provided, fetch resend_email_ids from database
    let resendEmailIds: string[] = []
    if (batchIds && Array.isArray(batchIds)) {
      const { data: events, error: eventsError } = await supabase
        .from('payroll_payslip_send_events')
        .select('resend_email_id')
        .in('batch_id', batchIds)
        .not('resend_email_id', 'is', null)

      if (eventsError) {
        console.error('Error fetching email IDs:', eventsError)
        return NextResponse.json(
          { error: 'Failed to fetch email IDs from database' },
          { status: 500 }
        )
      }

      resendEmailIds = (events || [])
        .map(e => e.resend_email_id)
        .filter((id): id is string => Boolean(id))
    } else if (emailIds && Array.isArray(emailIds)) {
      resendEmailIds = emailIds.filter((id): id is string => Boolean(id))
    }

    if (resendEmailIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid Resend email IDs found' },
        { status: 400 }
      )
    }

    // Check status for each email ID
    const statusUpdates: Array<{
      emailId: string
      status: string | null
      lastEvent: string | null
      updatedAt: string | null
      error?: string
    }> = []

    for (const emailId of resendEmailIds) {
      try {
        const emailData = await resend.emails.get(emailId)

        if (emailData.error) {
          statusUpdates.push({
            emailId,
            status: null,
            lastEvent: null,
            updatedAt: null,
            error: emailData.error.message || 'Unknown error',
          })
          continue
        }

        // Extract status from Resend response
        // Resend API returns last_event which can be: sent, delivered, bounced, complained, opened, clicked, etc.
        const lastEvent = emailData.data?.last_event || null
        const createdAt = emailData.data?.created_at || null

        // Map Resend events to our delivery_status
        let deliveryStatus: string | null = null
        if (lastEvent === 'delivered') {
          deliveryStatus = 'delivered'
        } else if (lastEvent === 'bounced' || lastEvent === 'complained') {
          deliveryStatus = 'failed'
        } else if (lastEvent === 'sent') {
          deliveryStatus = 'sent'
        } else if (lastEvent) {
          deliveryStatus = lastEvent // Store other events as-is (opened, clicked, etc.)
        }

        const now = new Date().toISOString()

        // Update database with latest status
        const { error: updateError } = await supabase
          .from('payroll_payslip_send_events')
          .update({
            delivery_status: deliveryStatus,
            delivery_status_updated_at: now,
            resend_last_event: lastEvent,
          })
          .eq('resend_email_id', emailId)

        if (updateError) {
          console.error(`Failed to update status for ${emailId}:`, updateError)
          statusUpdates.push({
            emailId,
            status: deliveryStatus,
            lastEvent,
            updatedAt: createdAt || now,
            error: 'Failed to update database',
          })
        } else {
          statusUpdates.push({
            emailId,
            status: deliveryStatus,
            lastEvent,
            updatedAt: createdAt || now,
          })
        }
      } catch (err: any) {
        console.error(`Error checking status for ${emailId}:`, err)
        statusUpdates.push({
          emailId,
          status: null,
          lastEvent: null,
          updatedAt: null,
          error: err?.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      checked: resendEmailIds.length,
      updates: statusUpdates,
    })
  } catch (error: any) {
    console.error('Error in check-resend-status:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

