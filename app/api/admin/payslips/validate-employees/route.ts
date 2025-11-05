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
      .select('id, employer_id, name')

    if (employeesError) {
      return NextResponse.json({ error: employeesError.message }, { status: 500 })
    }

    // Type guard and normalization
    const normalizeUUID = (uuid: string | null | undefined): string => {
      if (!uuid) return ''
      return String(uuid).trim().toLowerCase()
    }

    // Ensure validEmployees is an array and has the expected structure
    const employeesList = Array.isArray(validEmployees) ? validEmployees : []
    
    // Create a Set of valid combinations for fast lookup (normalized)
    const validCombinations = new Set(
      employeesList.map((emp: any) => 
        `${normalizeUUID(emp.id)}:${normalizeUUID(emp.employer_id)}`
      )
    )

    // Debug: Log some sample valid combinations for troubleshooting
    if (process.env.NODE_ENV === 'development') {
      console.log('Valid employee-employer combinations (first 5):', 
        Array.from(validCombinations).slice(0, 5))
    }

    // Check each combination
    const validationResults = combinations.map(combo => {
      const { employee_id, employer_id, employee_name, employer_name, batch_id } = combo
      const normalizedEmployeeId = normalizeUUID(employee_id)
      const normalizedEmployerId = normalizeUUID(employer_id)
      const combinationKey = `${normalizedEmployeeId}:${normalizedEmployerId}`
      const isValid = validCombinations.has(combinationKey)

      // Debug logging for invalid combinations
      if (!isValid && process.env.NODE_ENV === 'development') {
        console.log(`Invalid combination - batch_id: ${batch_id}, employee_id: ${employee_id}, employer_id: ${employer_id}, normalized: ${combinationKey}`)
        // Check if employee_id exists at all
        const employeeExists = employeesList.some((emp: any) => 
          normalizeUUID(emp.id) === normalizedEmployeeId
        )
        // Check if employer_id exists for any employee
        const employerExists = employeesList.some((emp: any) => 
          normalizeUUID(emp.employer_id) === normalizedEmployerId
        )
        console.log(`  - Employee ID exists: ${employeeExists}, Employer ID exists: ${employerExists}`)
      }

      if (isValid) {
        // Find the employee record to get the actual name from employees table (using normalized comparison)
        const employeeRecord = employeesList.find((emp: any) => 
          normalizeUUID(emp.id) === normalizedEmployeeId && 
          normalizeUUID(emp.employer_id) === normalizedEmployerId
        )
        
        return {
          batch_id,
          employee_id,
          employer_id,
          employee_name,
          employer_name,
          isValid: true,
          actualEmployeeName: (employeeRecord as any)?.name
        }
      } else {
        // Provide detailed error message
        const employeeExists = employeesList.some((emp: any) => 
          normalizeUUID(emp.id) === normalizedEmployeeId
        )
        const employerExists = employeesList.some((emp: any) => 
          normalizeUUID(emp.employer_id) === normalizedEmployerId
        )
        
        let issueMessage = 'Employee-employer combination not found in employees table'
        if (!employeeExists && !employerExists) {
          issueMessage = `Employee ID (${employee_id}) and Employer ID (${employer_id}) not found`
        } else if (!employeeExists) {
          issueMessage = `Employee ID (${employee_id}) not found in employees table`
        } else if (!employerExists) {
          issueMessage = `Employer ID (${employer_id}) not found for any employee`
        } else {
          // Both exist but not together - check if employee has different employer
          const employeeWithDifferentEmployer = employeesList.find((emp: any) => 
            normalizeUUID(emp.id) === normalizedEmployeeId
          )
          if (employeeWithDifferentEmployer) {
            issueMessage = `Employee ID (${employee_id}) exists but is associated with different employer ID (${(employeeWithDifferentEmployer as any).employer_id})`
          }
        }
        
        return {
          batch_id,
          employee_id,
          employer_id,
          employee_name,
          employer_name,
          isValid: false,
          issue: issueMessage
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
