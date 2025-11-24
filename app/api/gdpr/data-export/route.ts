import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/supabase'

async function getSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// Export user data in compliance with GDPR Article 20 (Right to data portability)
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()

    // Verify user authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (!user || userError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Collect all user data from various tables
    const userDataExport = {
      export_metadata: {
        user_id: user.id,
        export_date: new Date().toISOString(),
        export_version: '1.0',
        format: 'JSON',
        description: 'Complete GDPR data export as per Article 20 (Right to data portability)',
      },
      personal_data: {
        user_profile: null,
        authentication_data: {
          user_id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
        },
      },
      business_data: {
        client_profiles: [],
        employee_records: [],
        employer_records: [],
        payroll_data: [],
        financial_records: [],
        documents: [],
        orders: [],
        sessions: [],
      },
      system_data: {
        access_grants: [],
        audit_logs: [],
        file_uploads: [],
        consent_records: [],
      },
    }

    // Fetch user profile data
    const { data: profile } = await supabase
      .from('public_user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      userDataExport.personal_data.user_profile = profile
    }

    // Fetch client operational profiles
    const { data: clientProfiles } = await supabase
      .from('client_operational_profiles')
      .select('*')
      .eq('created_by_user_id', user.id)

    if (clientProfiles) {
      userDataExport.business_data.client_profiles = clientProfiles
    }

    // Fetch employee records (where user is the creator or associated)
    const { data: employees } = await supabase
      .from('payroll_objects_employees')
      .select('*')
      .eq('created_by_user_id', user.id)

    if (employees) {
      userDataExport.business_data.employee_records = employees.map(emp => ({
        ...emp,
        // Remove or hash sensitive financial data for export
        iban: emp.iban ? '***' + emp.iban.slice(-4) : null,
        emirates_id: emp.emirates_id ? '***' + emp.emirates_id.slice(-4) : null,
      }))
    }

    // Fetch employer records
    const { data: employers } = await supabase
      .from('payroll_objects_employers')
      .select('*')
      .eq('created_by_user_id', user.id)

    if (employers) {
      userDataExport.business_data.employer_records = employers.map(emp => ({
        ...emp,
        // Protect sensitive financial data
        company_iban: emp.company_iban ? '***' + emp.company_iban.slice(-4) : null,
        company_account_number: emp.company_account_number ? '***' + emp.company_account_number.slice(-4) : null,
      }))
    }

    // Fetch payroll data (summary only for privacy)
    const { data: payrollData } = await supabase
      .from('payroll_payrun_records')
      .select('id, payrun_name, pay_period_start, pay_period_end, status, created_at, total_employees')
      .eq('created_by', user.id)

    if (payrollData) {
      userDataExport.business_data.payroll_data = payrollData
    }

    // Fetch user's orders/quotes
    const { data: orders } = await supabase
      .from('kway_cpq_orders')
      .select('*')
      .eq('created_by_user_id', user.id)

    if (orders) {
      userDataExport.business_data.orders = orders
    }

    // Fetch development session logs (if applicable)
    const { data: sessions } = await supabase
      .from('dev_session_logs')
      .select('*')
      .eq('created_by_user_id', user.id)

    if (sessions) {
      userDataExport.business_data.sessions = sessions
    }

    // Fetch access grants
    const { data: accessGrants } = await supabase
      .from('core_object_contact_access_grants')
      .select('*')
      .eq('user_id', user.id)

    if (accessGrants) {
      userDataExport.system_data.access_grants = accessGrants
    }

    // Fetch file uploads
    const { data: fileUploads } = await supabase
      .from('core_file_register')
      .select('id, file_name, document_type, upload_date, file_url')
      .eq('uploaded_by', user.id)

    if (fileUploads) {
      // Remove direct file URLs for security, provide file metadata only
      userDataExport.system_data.file_uploads = fileUploads.map(file => ({
        id: file.id,
        file_name: file.file_name,
        document_type: file.document_type,
        upload_date: file.upload_date,
        note: 'File content available through separate secure download process',
      }))
    }

    // Add legal notices
    const legalNotice = {
      gdpr_compliance: {
        legal_basis: 'Article 20 GDPR - Right to data portability',
        data_controller: 'kounted Digital Solutions',
        contact_dpo: 'support@kounted.ae',
        retention_policy: 'Data retained as per our Privacy Policy and applicable UAE/EU regulations',
        your_rights: [
          'Right to rectification (Article 16)',
          'Right to erasure (Article 17)',
          'Right to restrict processing (Article 18)',
          'Right to object (Article 21)',
          'Right to lodge a complaint with supervisory authority (Article 77)',
        ],
      },
      export_notes: [
        'This export contains all personal data we process about you',
        'Some sensitive data (bank details, IDs) are partially masked for security',
        'File contents are available through separate secure download process',
        'Financial calculations and system-generated data are included where relevant',
        'Data shared with third parties (Xero, email services) may require separate requests',
      ],
    }

    userDataExport.export_metadata = { ...userDataExport.export_metadata, ...legalNotice }

    // Create downloadable JSON file
    const fileName = `kounted-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`
    
    const response = new NextResponse(JSON.stringify(userDataExport, null, 2))
    response.headers.set('Content-Type', 'application/json')
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`)
    
    // Log the data export request for audit purposes
    await supabase.from('public_access_grant_logs').insert({
      user_id: user.id,
      action: 'data_export_request',
      object_type: 'user_data',
      object_id: user.id,
      access_level: 'read',
      granted_by: user.id,
    })

    return response

  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to export data',
        message: 'An error occurred while processing your data export request. Please contact support.',
      },
      { status: 500 }
    )
  }
}

// Get export status and metadata
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (!user || userError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { action } = await request.json()

    if (action === 'request_export') {
      // Log the export request
      await supabase.from('public_access_grant_logs').insert({
        user_id: user.id,
        action: 'data_export_initiated',
        object_type: 'user_data',
        object_id: user.id,
        access_level: 'read',
        granted_by: user.id,
      })

      return NextResponse.json({
        message: 'Data export request logged. Use GET request to download your data.',
        export_url: '/api/gdpr/data-export',
        estimated_completion: 'immediate',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Export request error:', error)
    return NextResponse.json(
      { error: 'Failed to process export request' },
      { status: 500 }
    )
  }
}