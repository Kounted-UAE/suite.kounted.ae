// app/api/feature-request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'


const resend = new Resend(process.env['RESEND_API_KEY'] ?? '')

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    const html = `
    <div style="font-family: 'Geist', 'Inter', 'Segoe UI', Arial, sans-serif; color: #222;">
      <h2 style="font-family: 'Geist', 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 24px; font-weight: 600; color: #000; margin-bottom: 24px;">
        kounted Feature Request
      </h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Request:</b></p>
      <p style="white-space: pre-line;">${message}</p>
    </div>
  `
  

    await resend.emails.send({
      from: 'Online Notifications <notifications@kounted.ae>',
      to: 'support@kounted.ae',
      subject: 'New Feature Request',
      html,
      replyTo: email,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
