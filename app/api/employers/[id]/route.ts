// app/api/employers/[id]/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase
      .from('employers')
      .select('*')
      .eq('id', params.id)
      .single()
      
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
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
    
    if (body.reviewer_email !== undefined && !body.reviewer_email) {
      return NextResponse.json(
        { error: 'Reviewer email cannot be empty' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('employers')
      .update({
        ...(body.name && { name: body.name }),
        ...(body.reviewer_email && { reviewer_email: body.reviewer_email })
      })
      .eq('id', params.id)
      .select('*')
      .single()
      
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Employer with this name already exists' },
          { status: 409 }
        )
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
    
    // Check if employer has associated employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id')
      .eq('employer_id', params.id)
      .limit(1)
    
    if (employeesError) {
      return NextResponse.json({ error: employeesError.message }, { status: 500 })
    }
    
    if (employees && employees.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete employer with associated employees' },
        { status: 409 }
      )
    }
    
    const { error } = await supabase
      .from('employers')
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
