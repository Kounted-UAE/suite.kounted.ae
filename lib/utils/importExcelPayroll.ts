import { getSupabaseClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import type { Database } from '@/lib/types/supabase'

export async function importExcelPayroll(parsedRows: unknown[], employerId: string) {
  const supabase = getSupabaseClient()
  const batchId = uuidv4()
  const validatedRows: Record<string, any>[] = []

  for (let i = 0; i < parsedRows.length; i++) {
    const row = parsedRows[i]
    
    // Simple validation - only check required fields
    if (!row || typeof row !== 'object') {
      console.error(`Row ${i + 1} is not a valid object`)
      throw new Error(`Row ${i + 1} is not a valid object`)
    }

    const typedRow = row as any
    
    // Only validate required fields
    if (!typedRow.employee_id || !typedRow.employer_id) {
      console.error(`Row ${i + 1} missing required fields`)
      throw new Error(`Row ${i + 1} missing required fields: employee_id and employer_id are required`)
    }

    validatedRows.push({
      ...typedRow,
      // Ensure required fields are properly set
      employee_id: typedRow.employee_id,
      employer_id: typedRow.employer_id,
    })
  }

  console.log('Attempting to insert payroll batch:', {
    batchId,
    employerId,
    rowCount: validatedRows.length,
    sampleRow: validatedRows[0]
  })
  
  const { error, data } = await supabase
    .from('payroll_excel_imports')
    .insert(validatedRows)
    .select()
  
  if (error) {
    console.error('Error inserting payroll batch:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: JSON.stringify(error, null, 2)
    })
    throw new Error(`Failed to insert payroll batch: ${error.message || 'Unknown database error'}`)
  }
  
  console.log('Successfully inserted batch:', {
    batchId,
    insertedRows: data?.length,
    ids: data?.map((r: any) => r.id)
  })
  
  return batchId
}
