// app/api/admin/payslips/validate-employees/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServiceClient()
    const { combinations } = await request.json()

    if (!Array.isArray(combinations) || combinations.length === 0) {
      return NextResponse.json({ 
        error: 'combinations array required', 
        valid: [], 
        invalid: [] 
      }, { status: 400 })
    }

    // Get all valid employee-employer combinations from employees table
    const { data: validEmployees, error: employeesError } = await supabase
      .from('employees')
      .select('id, employer_id, name, employer:employers(name)')

    if (employeesError) {
      return NextResponse.json({ error: employeesError.message }, { status: 500 })
    }

    // Create a Set of valid combinations for fast lookup
    const validCombinations = new Set(
      (validEmployees || []).map(emp => `${emp.id}:${emp.employer_id}`)
    )

    // Check each combination
    const validationResults = combinations.map(combo => {
      const { employee_id, employer_id, employee_name, employer_name, batch_id } = combo
      const combinationKey = `${employee_id}:${employer_id}`
      const isValid = validCombinations.has(combinationKey)

      if (isValid) {
        // Find the employee record to get the actual name from employees table
        const employeeRecord = validEmployees.find(emp => 
          emp.id === employee_id && emp.employer_id === employer_id
        )
        
        return {
          batch_id,
          employee_id,
          employer_id,
          employee_name,
          employer_name,
          isValid: true,
          actualEmployeeName: employeeRecord?.name,
          actualEmployerName: employeeRecord?.employer?.name
        }
      } else {
        return {
          batch_id,
          employee_id,
          employer_id,
          employee_name,
          employer_name,
          isValid: false,
          issue: 'Employee-employer combination not found in employees table'
        }
      }
    })

    const valid = validationResults.filter(r => r.isValid)
    const invalid = validationResults.filter(r => !r.isValid)

    return NextResponse.json({
      valid,
      invalid,
      summary: {
        total: combinations.length,
        validCount: valid.length,
        invalidCount: invalid.length
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        valid: [],
        invalid: []
      },
      { status: 500 }
    )
  }
}
