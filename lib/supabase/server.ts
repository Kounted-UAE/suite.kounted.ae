// lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { VAuthenticatedProfile } from '@/lib/types/roles'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export type { VAuthenticatedProfile }

/**
 * User-level Supabase client that respects RLS policies based on authenticated user
 * Use this for all user-initiated actions
 */
export function getSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options })
      },
    },
  })
}

/**
 * Admin-level Supabase client that bypasses RLS policies
 * ONLY use for system operations, NOT for user-initiated actions
 * WARNING: This should only be used in specific admin routes after verifying user permissions
 */
export function getSupabaseAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured - admin operations not available')
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * DEPRECATED: Use getSupabaseServerClient() instead
 * This alias is for backwards compatibility only
 */
export const getSupabaseServiceClient = getSupabaseServerClient

/**
 * Get Supabase client with user context
 * Returns both the client and the authenticated user's profile
 */
export async function getSupabaseWithUser() {
  const supabase = getSupabaseServerClient()
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { supabase, user: null, profile: null, error: userError }
  }

  const { data: profile, error: profileError } = await supabase
    .from('v_authenticated_profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  return {
    supabase,
    user,
    profile: profile as VAuthenticatedProfile | null,
    error: profileError,
  }
}

/**
 * Request-aware client (for middleware and edge runtime)
 */
export function getSupabaseServerClientFromRequest(_req: NextRequest) {
  return getSupabaseServerClient()
}
