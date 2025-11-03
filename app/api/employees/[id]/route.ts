// app/api/employees/[id]/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        employer:employers(id, name, reviewer_email)
      `)
      .eq('id', params.id)
      .single()
      
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServiceClient()
    const body = await req.json()
    
    // Validate required fields if they are being updated
    if (body.name !== undefined && !body.name) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      )
    }
    
    // If employer_id is being updated, verify it exists
    if (body.employer_id) {
      const { data: employer, error: employerError } = await supabase
        .from('employers')
        .select('id')
        .eq('id', body.employer_id)
        .single()
      
      if (employerError || !employer) {
        return NextResponse.json(
          { error: 'Invalid employer_id' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.email_id !== undefined) updateData.email_id = body.email_id
    if (body.employee_mol !== undefined) updateData.employee_mol = body.employee_mol
    if (body.bank_name !== undefined) updateData.bank_name = body.bank_name
    if (body.iban !== undefined) updateData.iban = body.iban
    if (body.employer_id !== undefined) updateData.employer_id = body.employer_id

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        employer:employers(id, name, reviewer_email)
      `)
      .single()
      
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      if (error.code === '23505') {
        if (error.message.includes('employees_mol_key')) {
          return NextResponse.json(
            { error: 'Employee with this MOL ID already exists' },
            { status: 409 }
          )
        }
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServiceClient()
    
    // Check if employee has associated payroll records
    const { data: payrollRecords, error: payrollError } = await supabase
      .from('payroll_excel_imports')
      .select('id')
      .eq('employee_id', params.id)
      .limit(1)
    
    if (payrollError) {
      return NextResponse.json({ error: payrollError.message }, { status: 500 })
    }
    
    if (payrollRecords && payrollRecords.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete employee with associated payroll records' },
        { status: 409 }
      )
    }
    
    // Also check historical payroll records
    const { data: historicalRecords, error: historicalError } = await supabase
      .from('payroll_historical_payruns')
      .select('id')
      .eq('employee_id', params.id)
      .limit(1)
    
    if (historicalError) {
      return NextResponse.json({ error: historicalError.message }, { status: 500 })
    }
    
    if (historicalRecords && historicalRecords.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete employee with associated historical payroll records' },
        { status: 409 }
      )
    }
    
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', params.id)
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
