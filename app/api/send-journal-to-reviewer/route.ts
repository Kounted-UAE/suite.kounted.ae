import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env['RESEND_API_KEY'] ?? '')

interface EmailRequest {
  to: string
  employer: string
  csv: string
  filename: string
  subject?: string
  payrollPeriod?: string
  notes?: string
  journalType?: string // 'summary' | 'detailed' | etc (optional, for future)
}

export async function POST(req: NextRequest) {
  try {
    const { to, employer, csv, filename, subject, payrollPeriod, notes, journalType }: EmailRequest = await req.json()

    // Validation
    if (!to || !employer || !csv || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields: to, employer, csv, filename' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Dynamic subject based on journalType
    const prettyType = journalType
      ? journalType[0]?.toUpperCase() + journalType.slice(1)
      : 'Payroll Journal'
    const emailSubject =
      subject ||
      `${prettyType} Review Required - ${employer}${
        payrollPeriod ? ` (${payrollPeriod})` : ''
      }`
    
    // Get app URL from environment variable with fallback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://suite.kounted.ae'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        <style>
  body {
    font-family: 'Plus Jakarta Sans', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #FAFAFA;
    margin: 0;
    padding: 0;
  }
  .header {
    background-color: #000100;
    color: #FAFAFA;
    padding: 20px;
    text-align: center;
    font-weight: 600;
    font-size: 1.5rem;
    letter-spacing: 0.05em;
  }
  .content {
    padding: 20px 30px;
    background-color: white;
    color: #333;
    border-radius: 8px;
    max-width: 600px;
    margin: 20px auto;
  }
  .details {
    background-color: #e6f0fb; /* very light blue */
    padding: 15px;
    border-radius: 6px;
    margin: 15px 0;
    font-size: 0.9rem;
  }
  .highlight {
    background-color: #d0e5fd; /* light blue highlight */
    border-left: 4px solid #42B4ED;
    padding: 15px 10px;
    margin: 20px 0;
  }
  .footer {
    font-size: 11px;
    color: #888;
    text-align: center;
    padding: 15px;
    font-family: 'Plus Jakarta Sans', Arial, sans-serif;
  }
  a {
    color: #42B4ED;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  ol {
    padding-left: 20px;
  }
</style>

        </head>
       <body>
  <div class="header">${prettyType} Review Required</div>
  <div class="content">
    <p>Dear Accounting Team,</p>
    <p>Please find attached the <strong>${employer}</strong> journal entries for review.</p>

    <div class="details">
      <h3>Journal Details:</h3>
      <ul>
        <li><strong>Employer:</strong> ${employer}</li>
        ${payrollPeriod ? `<li><strong>Payroll Period:</strong> ${payrollPeriod}</li>` : ''}
        <li><strong>File:</strong> ${filename}</li>
        <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
      </ul>
    </div>

    ${notes ? `
      <div class="highlight">
        <h4>Additional Notes:</h4>
        <p>${notes}</p>
      </div>
    ` : ''}

    <div class="highlight">
      <h4>Next Steps:</h4>
      <ol>
        <li>Review the attached CSV file for accuracy</li>
        <li>Allocate Account and Tracking Codes to each line item</li>
        <li>Import the journal into Xero as a Manual Journal</li>
      </ol>
    </div>

    <p>The CSV file is formatted for direct import into Xero's Manual Journal feature. 
      However, Xero Account and Tracking Codes must be allocated to each line item individually. 
      To report errors or request support, please reply to <a href="mailto:payroll@kounted.ae">payroll@kounted.ae</a>.</p>

    <p>Kind regards,<br>Team Kounted</p>
  </div>

  <div class="footer">
    Powered by <a href="${appUrl}" target="_blank">kounted Web Forms</a><br>
    This email was sent on behalf of Kounted Accounting and Management Solutions.
  </div>
</body>

      </html>
    `

    const textContent = `
      ${prettyType} Review Required - ${employer}

      Dear Accounting Team,

      Please find attached the ${journalType ? journalType : 'payroll'} journal entries for ${employer} that require your review before importing into Xero Accounting.

      Journal Details:
      - Employer: ${employer}
      ${payrollPeriod ? `- Payroll Period: ${payrollPeriod}` : ''}
      - File: ${filename}
      - Generated: ${new Date().toLocaleString()}

      ${notes ? `Additional Notes: ${notes}` : ''}
     
      Next Steps:
      1. Review the attached CSV file for accuracy
      2. Allocate Account and Tracking Codes to each line item as required
      3. Import the journal into Xero as a Manual Journal
     
      The CSV file is formatted for direct import. 
      However, Xero Account and Tracking Codes must be allocated to each line item individually. 
      To report errors or request support, please reply to payroll@kounted.ae.

      Warm regards,
      Team kounted

      ---
      Powered by Kounted Web Forms (${appUrl}).
      This email was sent on behalf of Kounted Accounting and Management Solutions.
    `

    // Send email with Resend
    const result = await resend.emails.send({
      from: 'Kounted Payroll <payroll@resend.kounted.ae>',
      to,
      replyTo: 'Kounted Payroll <payroll@kounted.ae>',
      subject: emailSubject,
      html: htmlContent,
      text: textContent,
      attachments: [
        {
          filename,
          content: Buffer.from(csv, 'utf-8')
        }
      ]
    })

    console.log(`Journal email sent successfully to ${to} for ${employer}`, {
      messageId: result.data?.id,
      filename,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
      message: 'Journal email sent successfully'
    })

  } catch (error) {
    console.error('Error sending journal email:', error)
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
