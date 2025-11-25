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

    // Update user profile
    const { error: updateError } = await adminClient
      .from('public_user_profiles')
      .update({
        full_name: body.full_name,
        role_slug: body.role_slug,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    })
    
  } catch (error) {
    console.error('Error in update user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

