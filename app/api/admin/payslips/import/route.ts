import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const runtime = 'nodejs'


export async function POST(req: NextRequest) {
  try {
    console.log('Starting payslip import API...')
    const supabase = await getSupabaseServiceClient()
    
    const { rows } = await req.json().catch(() => ({ rows: [] }))
    
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log('No rows provided')
      return NextResponse.json({ error: 'rows array required' }, { status: 400 })
    }
    
    console.log(`Importing ${rows.length} rows...`)

    // Validate required fields for each row (only employee_id and employer_id are required)
    const validRows = rows.filter(row => {
      const hasEmployeeId = row.employee_id && String(row.employee_id).trim() !== ''
      const hasEmployerId = row.employer_id && String(row.employer_id).trim() !== ''
      return hasEmployeeId && hasEmployerId
    })

    console.log(`Validation complete: ${validRows.length} valid, ${rows.length - validRows.length} invalid`)

    if (validRows.length === 0) {
      return NextResponse.json({ 
        error: 'No valid rows found. Only employee_id and employer_id are required fields.',
        imported: 0,
        total: rows.length
      }, { status: 400 })
    }

    // Generate UUID for rows with empty id fields
    const rowsToInsert = validRows.map(row => {
      const cleanRow = { ...row }
      if (!cleanRow.id || String(cleanRow.id).trim() === '') {
        cleanRow.id = crypto.randomUUID()
      }
      return cleanRow
    })

    // Batch insert (500 rows per batch)
    const BATCH_SIZE = 500
    let importedCount = 0
    const errors: string[] = []

    for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
      const batch = rowsToInsert.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(rowsToInsert.length / BATCH_SIZE)
      
      console.log(`Importing batch ${batchNumber}/${totalBatches} (${batch.length} rows)`)

      const { data, error } = await supabase
        .from('payroll_excel_imports')
        .insert(batch)
        .select('id')

      if (error) {
        console.error(`Batch ${batchNumber} error:`, error)
        errors.push(`Batch ${batchNumber}: ${error.message}`)
      } else {
        importedCount += batch.length
        console.log(`Batch ${batchNumber} imported successfully. Total: ${importedCount}`)
      }
    }

    console.log(`Import complete: ${importedCount} imported, ${errors.length} batch errors`)

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false,
        imported: importedCount,
        total: rowsToInsert.length,
        errors
      }, { status: 207 }) // Multi-Status
    }

    return NextResponse.json({ 
      success: true,
      imported: importedCount,
      total: rowsToInsert.length
    })

  } catch (error: any) {
    console.error('Import API error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Unknown error',
      imported: 0
    }, { status: 500 })
  }
}

