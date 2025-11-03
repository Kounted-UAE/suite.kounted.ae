// app/api/employees/template/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Create CSV template for employees
    const csvHeaders = [
      'name',
      'email_id',
      'employee_mol',
      'bank_name',
      'iban',
      'employer_id'
    ]
    
    const csvExample = [
      'John Smith',
      'john.smith@acme.com', 
      'MOL123456',
      'Emirates NBD',
      'AE070331234567890123456',
      'employer-uuid-here'
    ]
    
    const csvExampleNoEmail = [
      'Jane Doe',
      '', // Empty email - payslips go to HR
      'MOL789012',
      'ADCB Bank',
      'AE123456789012345678901',
      'employer-uuid-here'
    ]
    
    // Create CSV content with both examples
    const csvContent = [
      csvHeaders.join(','),
      csvExample.join(','),
      csvExampleNoEmail.join(','),
      '',
      '# Notes:',
      '# - email_id is optional - leave blank if payslips go to HR contact',
      '# - MOL ID must be unique across all employees',
      '# - employer_id must be a valid UUID from the employers table'
    ].join('\n')
    
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="employees-template.csv"'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
