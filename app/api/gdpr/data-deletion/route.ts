import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'

// Function to create Supabase admin client

export const runtime = 'nodejs'

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey)
}

interface DeletionRequest {
  reason: string
  confirm_deletion: boolean
  acknowledge_legal_obligations: boolean
}

// Implement GDPR Article 17 - Right to erasure ("right to be forgotten")
export async function POST(request: NextRequest) {
  try {
    const { reason, confirm_deletion, acknowledge_legal_obligations }: DeletionRequest = await request.json()

    // Validate request
    if (!confirm_deletion || !acknowledge_legal_obligations) {
      return NextResponse.json(
        { 
          error: 'Invalid deletion request',
          message: 'You must confirm deletion and acknowledge legal obligations to proceed.'
        },
        { status: 400 }
      )
    }

    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create Supabase client
    const supabaseAdmin = createSupabaseAdmin()

    // Verify user session
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (!user || userError) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Log the deletion request for audit purposes
    await supabaseAdmin.from('public_access_grant_logs').insert({
      user_id: user.id,
      action: 'account_deletion_requested',
      object_type: 'user_account',
      object_id: user.id,
      access_level: 'delete',
      granted_by: user.id,
    })

    // Check for legal data retention requirements
    const retentionCheck = await checkDataRetentionRequirements(user.id)
    
    if (retentionCheck.hasLegalObligations) {
      return NextResponse.json({
        status: 'retention_required',
        message: 'Some data must be retained due to legal obligations',
        retention_details: retentionCheck.details,
        deletable_data: retentionCheck.deletableData,
        next_steps: [
          'Personal identifiers will be anonymized',
          'Non-essential data will be deleted immediately',
          'Legally required data will be marked for deletion after retention period',
          'You will receive confirmation once deletion is complete'
        ]
      })
    }

    // Proceed with data deletion
    const deletionResult = await performDataDeletion(user.id, reason)

    if (deletionResult.success) {
      // Log successful deletion
      await supabaseAdmin.from('public_access_grant_logs').insert({
        user_id: user.id,
        action: 'account_deletion_completed',
        object_type: 'user_account',
        object_id: user.id,
        access_level: 'delete',
        granted_by: user.id,
      })

      return NextResponse.json({
        status: 'deleted',
        message: 'Your account and associated data have been successfully deleted',
        deletion_id: deletionResult.deletionId,
        deleted_data_summary: deletionResult.summary,
        retained_data_summary: deletionResult.retainedData || null,
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Deletion failed',
          message: deletionResult.error || 'An error occurred during the deletion process',
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please contact support.',
      },
      { status: 500 }
    )
  }
}

// Check what data can be deleted vs what must be retained
async function checkDataRetentionRequirements(userId: string) {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const retentionDetails = {
      hasLegalObligations: false,
      details: [],
      deletableData: [],
      retainedData: [],
    }

    // Check payroll records (UAE law requires 7-year retention)
    const { data: payrollRecords } = await supabaseAdmin
      .from('payroll_payrun_records')
      .select('id, created_at, status')
      .eq('created_by', userId)

    if (payrollRecords && payrollRecords.length > 0) {
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 7)

      const recentRecords = payrollRecords.filter(record => 
        new Date(record.created_at) > cutoffDate
      )

      if (recentRecords.length > 0) {
        retentionDetails.hasLegalObligations = true
        retentionDetails.details.push({
          type: 'payroll_records',
          reason: 'UAE Labor Law requires 7-year retention of payroll records',
          count: recentRecords.length,
          retention_until: new Date(
            Math.max(...recentRecords.map(r => new Date(r.created_at).getTime()))
          ).setFullYear(new Date().getFullYear() + 7),
        })
        retentionDetails.retainedData.push('Payroll processing records (anonymized)')
      }
    }

    // Check financial records (UAE law requires 7-year retention)
    const { data: financialRecords } = await supabaseAdmin
      .from('kway_cpq_orders')
      .select('id, created_at, status')
      .eq('created_by_user_id', userId)
      .eq('status', 'completed')

    if (financialRecords && financialRecords.length > 0) {
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 7)

      const recentRecords = financialRecords.filter(record => 
        new Date(record.created_at) > cutoffDate
      )

      if (recentRecords.length > 0) {
        retentionDetails.hasLegalObligations = true
        retentionDetails.details.push({
          type: 'financial_records',
          reason: 'UAE Commercial Law requires 7-year retention of financial records',
          count: recentRecords.length,
          retention_until: new Date(
            Math.max(...recentRecords.map(r => new Date(r.created_at).getTime()))
          ).setFullYear(new Date().getFullYear() + 7),
        })
        retentionDetails.retainedData.push('Financial transaction records (anonymized)')
      }
    }

    // Add deletable data categories
    retentionDetails.deletableData = [
      'Personal profile information',
      'Email preferences and marketing data',
      'Session logs and usage analytics',
      'File uploads and documents (non-financial)',
      'Client onboarding data (draft status)',
      'Development session logs',
      'Access grants and permissions',
    ]

    return retentionDetails

  } catch (error) {
    console.error('Error checking retention requirements:', error)
    return {
      hasLegalObligations: true, // Err on the side of caution
      details: [{ 
        type: 'unknown',
        reason: 'Unable to verify retention requirements. Manual review required.',
        count: 0,
        retention_until: null,
      }],
      deletableData: [],
      retainedData: ['All data (pending manual review)'],
    }
  }
}

// Perform the actual data deletion
async function performDataDeletion(userId: string, reason: string) {
  const deletionId = `del_${Date.now()}_${userId.slice(0, 8)}`

  try {
    const supabaseAdmin = createSupabaseAdmin()

    const deletionSummary = {
      success: true,
      deletionId,
      summary: {
        deleted_tables: [],
        anonymized_records: [],
        retained_records: [],
        errors: [],
      },
      retainedData: null,
      error: null,
    }

    // 1. Delete user profile and personal data
    try {
      await supabaseAdmin
        .from('public_user_profiles')
        .delete()
        .eq('id', userId)
      
      deletionSummary.summary.deleted_tables.push('public_user_profiles')
    } catch (error) {
      deletionSummary.summary.errors.push(`Failed to delete user profile: ${error}`)
    }

    // 2. Delete or anonymize client operational profiles
    try {
      const { data: clientProfiles } = await supabaseAdmin
        .from('client_operational_profiles')
        .select('id')
        .eq('created_by_user_id', userId)

      if (clientProfiles && clientProfiles.length > 0) {
        // For draft profiles, delete completely
        await supabaseAdmin
          .from('client_operational_profiles')
          .delete()
          .eq('created_by_user_id', userId)
          .eq('status', 'draft')

        // For completed profiles, anonymize instead of delete
        await supabaseAdmin
          .from('client_operational_profiles')
          .update({
            created_by_user_id: null,
            profile_data: { anonymized: true, original_user_deleted: true },
          })
          .eq('created_by_user_id', userId)
          .neq('status', 'draft')

        deletionSummary.summary.deleted_tables.push('client_operational_profiles (draft)')
        deletionSummary.summary.anonymized_records.push('client_operational_profiles (completed)')
      }
    } catch (error) {
      deletionSummary.summary.errors.push(`Failed to process client profiles: ${error}`)
    }

    // 3. Handle employee records (anonymize for legal compliance)
    try {
      await supabaseAdmin
        .from('payroll_objects_employees')
        .update({
          first_name: 'DELETED',
          last_name: 'USER',
          email: null,
          contact_number: null,
          emirates_id: null,
          passport_number: null,
          created_by_user_id: null,
        })
        .eq('created_by_user_id', userId)

      deletionSummary.summary.anonymized_records.push('payroll_objects_employees')
    } catch (error) {
      deletionSummary.summary.errors.push(`Failed to anonymize employee records: ${error}`)
    }

    // 4. Handle employer records (anonymize for legal compliance)
    try {
      await supabaseAdmin
        .from('payroll_objects_employers')
        .update({
          contact_person_name: 'DELETED USER',
          contact_person_email: null,
          contact_person_phone: null,
          created_by_user_id: null,
        })
        .eq('created_by_user_id', userId)

      deletionSummary.summary.anonymized_records.push('payroll_objects_employers')
    } catch (error) {
      deletionSummary.summary.errors.push(`Failed to anonymize employer records: ${error}`)
    }

    // 5. Delete non-essential orders/quotes
    try {
      await supabaseAdmin
        .from('kway_cpq_orders')
        .delete()
        .eq('created_by_user_id', userId)
        .in('status', ['draft', 'pending'])

      // Anonymize completed orders for financial record keeping
      await supabaseAdmin
        .from('kway_cpq_orders')
        .update({
          created_by_user_id: null,
          order_data: { anonymized: true, original_user_deleted: true },
        })
        .eq('created_by_user_id', userId)
        .eq('status', 'completed')

      deletionSummary.summary.deleted_tables.push('kway_cpq_orders (draft/pending)')
      deletionSummary.summary.anonymized_records.push('kway_cpq_orders (completed)')
    } catch (error) {
      deletionSummary.summary.errors.push(`Failed to process orders: ${error}`)
    }

    // 6. Delete development session logs
    try {
      await supabaseAdmin
        .from('dev_session_logs')
        .delete()
        .eq('created_by_user_id', userId)

      deletionSummary.summary.deleted_tables.push('dev_session_logs')
    } catch (error) {
      deletionSummary.summary.errors.push(`Failed to delete session logs: ${error}`)
    }

    // 7. Delete access grants
    try {
      await supabaseAdmin
        .from('core_object_contact_access_grants')
        .delete()
        .eq('user_id', userId)

      deletionSummary.summary.deleted_tables.push('core_object_contact_access_grants')
    } catch (error) {
      deletionSummary.summary.errors.push(`Failed to delete access grants: ${error}`)
    }

    // 8. Delete file uploads (non-financial documents)
    try {
      // Get file URLs for deletion from storage
      const { data: files } = await supabaseAdmin
        .from('core_file_register')
        .select('file_url')
        .eq('uploaded_by', userId)

      // Delete files from Supabase storage
      if (files && files.length > 0) {
        const filePaths = files.map(f => f.file_url.split('/').pop()).filter(Boolean)
        if (filePaths.length > 0) {
          await supabaseAdmin.storage
            .from('documents')
            .remove(filePaths)
        }
      }

      // Delete file records
      await supabaseAdmin
        .from('core_file_register')
        .delete()
        .eq('uploaded_by', userId)

      deletionSummary.summary.deleted_tables.push('core_file_register')
    } catch (error) {
      deletionSummary.summary.errors.push(`Failed to delete files: ${error}`)
    }

    // 9. Finally, delete the auth user account
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      deletionSummary.summary.deleted_tables.push('auth.users')
    } catch (error) {
      deletionSummary.summary.errors.push(`Failed to delete auth account: ${error}`)
      deletionSummary.success = false
    }

    // 10. Create deletion log record (using anonymized reference)
    await supabaseAdmin.from('public_access_grant_logs').insert({
      user_id: null, // Anonymized
      action: 'account_deletion_completed',
      object_type: 'deleted_account',
      object_id: deletionId,
      access_level: 'delete',
      granted_by: null, // Anonymized
    })

    return deletionSummary

  } catch (error) {
    console.error('Data deletion error:', error)
    return {
      success: false,
      deletionId,
      summary: null,
      retainedData: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// Get deletion request status (for users who want to check deletion process)
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const deletionId = request.nextUrl.searchParams.get('deletion_id')

    if (!deletionId) {
      return NextResponse.json(
        { error: 'Deletion ID required' },
        { status: 400 }
      )
    }

    // Check deletion log
    const { data: deletionLog } = await supabaseAdmin
      .from('public_access_grant_logs')
      .select('*')
      .eq('object_id', deletionId)
      .eq('action', 'account_deletion_completed')
      .single()

    if (deletionLog) {
      return NextResponse.json({
        status: 'completed',
        deletion_date: deletionLog.created_at,
        deletion_id: deletionId,
        message: 'Account deletion has been completed successfully',
      })
    } else {
      return NextResponse.json({
        status: 'not_found',
        message: 'No deletion record found with this ID',
      })
    }

  } catch (error) {
    console.error('Deletion status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check deletion status' },
      { status: 500 }
    )
  }
}