// app/api/employees/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'


export async function GET() {
  try {
    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        employer:employers(id, name, reviewer_email)
      `)
      .order('created_at', { ascending: false })
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServiceClient()
    const body = await req.json()
    
    // Validate required fields
    if (!body.name || !body.employer_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, employer_id' },
        { status: 400 }
      )
    }

    // Verify employer exists
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

    const { data, error } = await supabase
      .from('employees')
      .insert({
        name: body.name,
        email_id: body.email_id,
        employee_mol: body.employee_mol,
        bank_name: body.bank_name,
        iban: body.iban,
        employer_id: body.employer_id
      })
      .select(`
        *,
        employer:employers(id, name, reviewer_email)
      `)
      .single()
      
    if (error) {
      // Handle unique constraint violations
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
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}
