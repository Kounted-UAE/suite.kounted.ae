import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'


const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { to, name, url, batch_id } = await req.json()

  if (!to || !name || !url) {
    return new NextResponse('Missing required fields', { status: 400 })
  }

  console.log('📧 Sending to:', to)
console.log('👤 Name:', name)
console.log('📄 PDF:', url)


  const subject = `Your latest payslip is now available`
  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #111;">
    <h2 style="font-size: 18px; font-weight: 600;">Hi ${name},</h2>
    <p style="font-size: 14px; line-height: 1.5; margin: 16px 0;">
      Your payslip is now ready to view with correct employer name. Please click the button below to securely access and download your payslip.
    </p>

    <a href="${url}" target="_blank" style="
      display: inline-block;
      background-color: #0d9488;
      color: white;
      text-decoration: none;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 14px;
      margin: 20px 0;
    ">
      View Payslip
    </a>

    <p style="font-size: 13px; color: #555;">
      If you have any questions, please reach out to your payroll administrator at <a href="mailto:payroll@kounted.ae">payroll@kounted.ae</a>.
    </p>

    <p style="font-size: 12px; color: #888; margin-top: 32px;">
      Do not reply directly to this email.
    </p>
  </div>
  `

  try {
    const result = await resend.emails.send({
      from: 'Kounted Payroll <payroll@resend.kounted.ae>',
      replyTo: 'Kounted Payroll <payroll@kounted.ae>',
      to,
      subject,
      html,
    })

    // Validate Resend response - check if email ID exists
    const resendEmailId = result.data?.id
    if (!resendEmailId) {
      console.error('⚠️ Resend returned success but no email ID:', result)
      // This is a warning but we'll still log it as sent since Resend accepted it
      // The email might have been queued but ID not returned
    }

    // Log send event with Resend email ID (best-effort)
    try {
      const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL
      const keyEnv = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (urlEnv && keyEnv && batch_id) {
        const supabase = createClient(urlEnv, keyEnv)
        const now = new Date().toISOString()
        await supabase
          .from('payroll_payslip_send_events')
          .insert({
            batch_id,
            recipients: Array.isArray(to) ? to.join(', ') : String(to),
            status: 'sent',
            error_message: resendEmailId ? null : 'Resend accepted email but did not return email ID',
            resend_email_id: resendEmailId || null,
            delivery_status: 'sent',
            delivery_status_updated_at: now,
            resend_last_event: 'sent',
          })
      }
    } catch (e) {
      console.warn('⚠️ Failed to log send event', e)
    }

    // Return response with Resend email ID for frontend tracking
    return NextResponse.json({ 
      success: true, 
      resendEmailId: resendEmailId || null,
      warning: resendEmailId ? null : 'Email accepted but Resend ID not returned',
      result 
    })
  } catch (err: any) {
    console.error('❌ Email send failed:', err)
    
    // Extract error message
    const errorMessage = err?.message || err?.toString() || 'Unknown error'
    const errorDetails = err?.response?.data || err?.data || null
    
    // Log failure event (best-effort)
    try {
      const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL
      const keyEnv = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (urlEnv && keyEnv && batch_id) {
        const supabase = createClient(urlEnv, keyEnv)
        await supabase
          .from('payroll_payslip_send_events')
          .insert({
            batch_id,
            recipients: Array.isArray(to) ? to.join(', ') : String(to),
            status: 'failed',
            error_message: errorMessage,
            delivery_status: 'failed',
            delivery_status_updated_at: new Date().toISOString(),
          })
      }
    } catch (e) {
      console.warn('⚠️ Failed to log send failure event', e)
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: errorDetails 
      }, 
      { status: 500 }
    )
  }
}
