// app/api/employers/bulk-import/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface EmployerImportData {
  name: string
  reviewer_email: string
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServiceClient()
    const body = await req.json()
    
    if (!body.employers || !Array.isArray(body.employers)) {
      return NextResponse.json(
        { error: 'Invalid request: employers array is required' },
        { status: 400 }
      )
    }

    const employers: EmployerImportData[] = body.employers

    // Validate all required fields before processing
    const validationErrors: { row: number; error: string }[] = []
    
    employers.forEach((emp, idx) => {
      if (!emp.name || !emp.name.trim()) {
        validationErrors.push({
          row: idx + 2,
          error: 'Missing required field: name'
        })
      }
      if (!emp.reviewer_email || !emp.reviewer_email.trim()) {
        validationErrors.push({
          row: idx + 2,
          error: 'Missing required field: reviewer_email'
        })
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.reviewer_email.trim())) {
        validationErrors.push({
          row: idx + 2,
          error: 'Invalid email format: reviewer_email'
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

    // Insert employers in batches (Supabase has a limit)
    const batchSize = 100
    const results: any[] = []
    let imported = 0
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < employers.length; i += batchSize) {
      const batch = employers.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('employers')
        .insert(
          batch.map(emp => ({
            name: emp.name.trim(),
            reviewer_email: emp.reviewer_email.trim()
          }))
        )
        .select('*')

      if (error) {
        // Handle unique constraint violations and other errors
        if (error.code === '23505') {
          // Unique constraint violation
          const failedRows = batch.map((_, idx) => i + idx + 2)
          errors.push({
            row: failedRows[0],
            error: 'Duplicate employer (employer name already exists)'
          })
        } else {
          return NextResponse.json(
            { 
              error: 'Failed to import employers', 
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
        total: employers.length,
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

