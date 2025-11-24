// lib/supabase/auth.ts
'use client'

import { getSupabaseClient } from '@/lib/supabase/client'

export async function signInWithOtp(email: string) {
  const supabase = getSupabaseClient()

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
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })
  return { data, error }
}

export async function sendResetPasswordEmail(email: string, redirectTo?: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
  })
  return { data, error }
}

export async function updateUserPassword(newPassword: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  return { data, error }
}

export async function signOut() {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Optional: password-based sign-in if you use it
export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}
