// lib/supabase/auth.ts

import { getSupabaseClient } from "./client"

export async function signInWithOTP(email: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  })
  return { error }
}

export async function verifyOTP(email: string, token: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  })
  return { ...data, error }
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { ...data, error }
}

export async function sendResetPasswordEmail(email: string, redirectTo?: string) {
  const supabase = getSupabaseClient()
  const options = redirectTo ? { redirectTo } : undefined
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  return { ...data, error }
}

export async function updateUserPassword(newPassword: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  return { ...data, error }
}
