// app/api/employees/bulk-import/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface EmployeeImportData {
  name: string
  email_id: string | null
  employee_mol: string | null
  bank_name: string | null
  iban: string | null
  employer_id: string
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServiceClient()
    const body = await req.json()
    
    if (!body.employees || !Array.isArray(body.employees)) {
      return NextResponse.json(
        { error: 'Invalid request: employees array is required' },
        { status: 400 }
      )
    }

    const employees: EmployeeImportData[] = body.employees

    // Validate all required fields before processing
    const validationErrors: { row: number; error: string }[] = []
    
    employees.forEach((emp, idx) => {
      if (!emp.name || !emp.name.trim()) {
        validationErrors.push({
          row: idx + 2,
          error: 'Missing required field: name'
        })
      }
      if (!emp.employer_id) {
        validationErrors.push({
          row: idx + 2,
          error: 'Missing required field: employer_id'
        })
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationErrors 
        },
        { status: 400 }
      )
    }

    // Verify all employer_ids exist
    const uniqueEmployerIds = [...new Set(employees.map(e => e.employer_id))]
    const { data: employers, error: employerError } = await supabase
      .from('employers')
      .select('id')
      .in('id', uniqueEmployerIds)

    if (employerError) {
      return NextResponse.json(
        { error: 'Failed to verify employer IDs', details: employerError.message },
        { status: 500 }
      )
    }

    const validEmployerIds = new Set(employers?.map(e => e.id) || [])
    const invalidEmployers = uniqueEmployerIds.filter(id => !validEmployerIds.has(id))

    if (invalidEmployers.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid employer IDs found', 
          details: `The following employer IDs do not exist: ${invalidEmployers.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Insert employees in batches (Supabase has a limit)
    const batchSize = 100
    const results: any[] = []
    let imported = 0
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('employees')
        .insert(
          batch.map(emp => ({
            name: emp.name.trim(),
            email_id: emp.email_id?.trim() || null,
            employee_mol: emp.employee_mol?.trim() || null,
            bank_name: emp.bank_name?.trim() || null,
            iban: emp.iban?.trim() || null,
            employer_id: emp.employer_id
          }))
        )
        .select(`
          *,
          employer:employers(id, name, reviewer_email)
        `)

      if (error) {
        // Handle unique constraint violations and other errors
        if (error.code === '23505') {
          // Unique constraint violation
          const failedRows = batch.map((_, idx) => i + idx + 2)
          errors.push({
            row: failedRows[0],
            error: 'Duplicate employee (check MOL ID or other unique fields)'
          })
        } else {
          return NextResponse.json(
            { 
              error: 'Failed to import employees', 
              details: error.message,
              imported 
            },
            { status: 500 }
          )
        }
      } else {
        results.push(...(data || []))
        imported += data?.length || 0
      }
    }

    return NextResponse.json(
      { 
        success: true,
        imported,
        total: employees.length,
        errors: errors.length > 0 ? errors : undefined,
        data: results
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}

