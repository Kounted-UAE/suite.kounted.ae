// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const type = url.searchParams.get('type') // signup, recovery, etc.

  console.log('[Auth Callback] Received request:', {
    code: code ? 'present' : 'missing',
    type,
    url: url.toString(),
  })

  // If there is no code, send user back to login
  if (!code) {
    console.error('[Auth Callback] No code provided')
    return NextResponse.redirect(
      new URL('/?error=Missing authentication code', url.origin),
    )
  }

  try {
    const supabase = getSupabaseServerClient()

    console.log('[Auth Callback] Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      // invalid/expired code – send back to login with message
      console.error('[Auth Callback] Code exchange error:', error.message, error)
      const errorMessage = encodeURIComponent('Invalid or expired link. Please request a new one.')
      return NextResponse.redirect(
        new URL(`/?error=${errorMessage}`, url.origin),
      )
    }

    console.log('[Auth Callback] Code exchange successful:', {
      userId: data?.user?.id,
      sessionPresent: !!data?.session,
    })

    // Decide where to go based on type
    let redirectPath = '/suite' // default dashboard

    switch (type) {
      case 'recovery':
      case 'password_reset':
        redirectPath = `/auth/reset-password`
        console.log('[Auth Callback] Redirecting to password reset')
        break

      case 'signup':
      case 'invite':
      case 'email_change':
      case 'magiclink':
      case 'reauthentication':
      case 'sso':
      default:
        redirectPath = '/suite'
        console.log('[Auth Callback] Redirecting to suite dashboard')
        break
    }

    const redirectUrl = new URL(redirectPath, url.origin)
    console.log('[Auth Callback] Final redirect:', redirectUrl.toString())
    
    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err)
    const errorMessage = encodeURIComponent('Authentication failed. Please try again.')
    return NextResponse.redirect(
      new URL(`/?error=${errorMessage}`, url.origin),
    )
  }
}
