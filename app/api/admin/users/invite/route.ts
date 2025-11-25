// app/api/admin/users/invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseWithUser, getSupabaseAdminClient } from '@/lib/supabase/server'
import { canManageUsers } from '@/lib/utils/roles'

export const runtime = 'nodejs'

interface InviteUserRequest {
  email: string
  role_slug: string
  full_name?: string
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication and permissions
    const { user, profile, error: authError } = await getSupabaseWithUser()
    
    if (authError || !user || !profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!canManageUsers(profile)) {
      return NextResponse.json(
        { error: 'You do not have permission to invite users' },
        { status: 403 }
      )
    }

    const body: InviteUserRequest = await req.json()
    
    if (!body.email || !body.role_slug) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['kounted-superadmin', 'kounted-admin', 'kounted-staff', 'client-admin', 'client-standard']
    if (!validRoles.includes(body.role_slug)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const adminClient = getSupabaseAdminClient()

    // Create user with email (they'll receive an invitation email)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: body.email,
      email_confirm: false, // User must confirm email
      user_metadata: {
        full_name: body.full_name || '',
        invited_by: user.id,
        invited_at: new Date().toISOString(),
      },
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to create user' },
        { status: 500 }
      )
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create profile entry with role
    const { error: profileError } = await adminClient
      .from('public_user_profiles')
      .insert({
        id: newUser.user.id,
        email: body.email,
        full_name: body.full_name || '',
        role_slug: body.role_slug,
        is_active: true,
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Try to clean up the created user
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Send invitation email
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(body.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    })

    if (inviteError) {
      console.error('Error sending invite:', inviteError)
      // User is created but invite failed - log but don't fail the request
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        role_slug: body.role_slug,
      },
    })
    
  } catch (error) {
    console.error('Error in user invite API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

