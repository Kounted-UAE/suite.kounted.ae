// app/api/admin/users/list/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseWithUser, getSupabaseAdminClient } from '@/lib/supabase/server'
import { canManageUsers } from '@/lib/utils/roles'

export const runtime = 'nodejs'

export async function GET() {
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
        { error: 'You do not have permission to manage users' },
        { status: 403 }
      )
    }

    // Use admin client to list all users
    const adminClient = getSupabaseAdminClient()
    
    // Get all users from auth
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error listing users:', usersError)
      return NextResponse.json(
        { error: 'Failed to list users' },
        { status: 500 }
      )
    }

    // Get profiles for all users
    const { data: profiles, error: profilesError } = await adminClient
      .from('v_authenticated_profiles')
      .select('*')
      .in('auth_user_id', users.map(u => u.id))

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    // Combine user data with profiles
    const usersWithProfiles = users.map(user => {
      const userProfile = profiles?.find(p => p.auth_user_id === user.id)
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        profile: userProfile || null,
      }
    })

    return NextResponse.json({
      users: usersWithProfiles,
      total: usersWithProfiles.length,
    })
    
  } catch (error) {
    console.error('Error in users list API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

