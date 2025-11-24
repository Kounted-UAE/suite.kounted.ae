// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const type = url.searchParams.get('type') // signup, recovery, etc.

  // If there is no code, send user back to login
  if (!code) {
    return NextResponse.redirect(
      new URL('/?error=Missing authentication code', url.origin),
    )
  }

  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // invalid/expired code – send back to login with message
    console.error('Code exchange error:', error)
    const errorMessage = encodeURIComponent('Invalid or expired link. Please request a new one.')
    return NextResponse.redirect(
      new URL(`/?error=${errorMessage}`, url.origin),
    )
  }

  // Decide where to go based on type
  let redirectPath = '/suite' // default dashboard

  switch (type) {
    case 'recovery':
    case 'password_reset':
      redirectPath = `/auth/reset-password?code=${encodeURIComponent(code)}`
      break

    case 'signup':
    case 'invite':
    case 'email_change':
    case 'magiclink':
    case 'reauthentication':
    case 'sso':
    default:
      redirectPath = '/suite'
      break
  }

  return NextResponse.redirect(new URL(redirectPath, url.origin))
}
