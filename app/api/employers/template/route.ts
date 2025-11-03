// app/api/employers/template/route.ts
import { NextResponse } from 'next/server'

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
    
    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      csvExample.join(',')
    ].join('\n')
    
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="employers-template.csv"'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
