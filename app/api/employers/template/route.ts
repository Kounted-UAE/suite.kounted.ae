// app/api/employers/template/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Create CSV template for employers
    const csvHeaders = [
      'name',
      'reviewer_email'
    ]
    
    const csvExample = [
      'ACME Corporation LLC',
      'hr@acme.com'
    ]
    
    const csvExample2 = [
      'Tech Solutions FZ-LLC',
      'payroll@techsolutions.ae'
    ]
    
    // Create CSV content with both examples
    const csvContent = [
      csvHeaders.join(','),
      csvExample.join(','),
      csvExample2.join(',')
    ].join('\n')
    
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="employers-import-template.csv"'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
