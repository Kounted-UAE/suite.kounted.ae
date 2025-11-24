// lib/supabase/auth.ts
'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

let browserClient: SupabaseClient | null = null

function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  return browserClient
}

export async function signInWithOtp(email: string) {
  const supabase = getBrowserClient()

  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  return { data, error }
}

// Alias for backwards compatibility
export const signInWithOTP = signInWithOtp

export async function verifyOTP(email: string, token: string) {
  const supabase = getBrowserClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })
  return { data, error }
}

export async function sendResetPasswordEmail(email: string, redirectTo?: string) {
  const supabase = getBrowserClient()
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
  })
  return { data, error }
}

export async function updateUserPassword(newPassword: string) {
  const supabase = getBrowserClient()
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  return { data, error }
}

export async function signOut() {
  const supabase = getBrowserClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Optional: password-based sign-in if you use it
export async function signInWithPassword(email: string, password: string) {
  const supabase = getBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}
