// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseWithUser, getSupabaseAdminClient } from '@/lib/supabase/server'
import { canManageUsers } from '@/lib/utils/roles'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, profile, error: authError } = await getSupabaseWithUser()
    
    if (authError || !user || !profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!canManageUsers(profile)) {
      return NextResponse.json(
        { error: 'You do not have permission to view users' },
        { status: 403 }
      )
    }

    const adminClient = getSupabaseAdminClient()
    
    // Get user from auth
    const { data: { user: targetUser }, error: userError } = await adminClient.auth.admin.getUserById(params.id)
    
    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get profile
    const { data: targetProfile, error: profileError } = await adminClient
      .from('v_authenticated_profiles')
      .select('*')
      .eq('auth_user_id', params.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    return NextResponse.json({
      id: targetUser.id,
      email: targetUser.email,
      created_at: targetUser.created_at,
      last_sign_in_at: targetUser.last_sign_in_at,
      profile: targetProfile || null,
    })
    
  } catch (error) {
    console.error('Error in get user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, profile, error: authError } = await getSupabaseWithUser()
    
    if (authError || !user || !profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!canManageUsers(profile)) {
      return NextResponse.json(
        { error: 'You do not have permission to update users' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const adminClient = getSupabaseAdminClient()

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Only include fields that are explicitly provided (not undefined)
    if (body.full_name !== undefined) {
      updateData.full_name = body.full_name
    }
    if (body.role_slug !== undefined) {
      updateData.role_slug = body.role_slug
    }
    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active
    }

    // Handle email update separately (requires auth admin API)
    const hasEmailUpdate = body.email !== undefined

    // Check if we have any fields to update
    const hasProfileUpdate = Object.keys(updateData).length > 1 // More than just updated_at
    if (!hasProfileUpdate && !hasEmailUpdate) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      )
    }

    // Update email if provided
    if (hasEmailUpdate) {
      const { error: emailError } = await adminClient.auth.admin.updateUserById(
        params.id,
        { email: body.email }
      )

      if (emailError) {
        console.error('Error updating email:', {
          error: emailError,
          userId: params.id,
          newEmail: body.email,
          message: emailError.message,
        })
        return NextResponse.json(
          { 
            error: 'Failed to update email',
            details: emailError.message || 'Auth update failed'
          },
          { status: 500 }
        )
      }

      // Also update email in profile table
      updateData.email = body.email
    }

    // Update user profile if there are profile fields to update
    if (hasProfileUpdate || hasEmailUpdate) {
      const { error: updateError, data: updatedRows } = await adminClient
        .from('public_user_profiles')
        .update(updateData)
        .eq('id', params.id)
        .select()

      if (updateError) {
        console.error('Error updating profile:', {
          error: updateError,
          userId: params.id,
          updateData,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        })
        return NextResponse.json(
          { 
            error: 'Failed to update user',
            details: updateError.message || 'Database update failed'
          },
          { status: 500 }
        )
      }

      // Log if no rows were updated (user might not exist in profile table)
      if (!updatedRows || updatedRows.length === 0) {
        console.warn('No rows updated for user:', {
          userId: params.id,
          updateData,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    })
    
  } catch (error) {
    console.error('Error in update user API:', {
      error,
      userId: params.id,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, profile, error: authError } = await getSupabaseWithUser()
    
    if (authError || !user || !profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!canManageUsers(profile)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete users' },
        { status: 403 }
      )
    }

    // Don't allow users to delete themselves
    if (params.id === user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    const adminClient = getSupabaseAdminClient()

    // Delete user from auth (this will cascade to profile)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(params.id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
    
  } catch (error) {
    console.error('Error in delete user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

