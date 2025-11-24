'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { updateUserPassword } from '@/lib/supabase/auth'
import { Container } from '@/components/react-layout/Container'
import { RootLayout } from '@/components/react-layout/RootLayout'
import { FadeIn } from '@/components/react-layout/FadeIn'
import { Input } from '@/components/react-ui/input'
import { Button } from '@/components/react-ui/button'
import { Label } from '@/components/react-ui/label'
import { Alert, AlertDescription } from '@/components/react-ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  // Verify user has a valid session (set by /auth/callback after code exchange)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          // No valid session - redirect to forgot-password page
          setError('Invalid or expired reset link. Please request a new password reset.')
          setTimeout(() => {
            router.push('/auth/forgot-password')
          }, 3000)
          setCheckingSession(false)
          return
        }
        
        // Valid session exists, allow password reset
        setCheckingSession(false)
      } catch (err) {
        console.error('Error checking session:', err)
        setError('An error occurred. Please try again.')
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [router])

  // Supabase routes here after /auth/callback exchanges the code for a session
  // The session is already established, so we just need to allow password update

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { error } = await updateUserPassword(password)
    if (error) setError(error.message)
    else {
      setSuccess('Password updated. Redirecting to login...')
      setTimeout(() => router.push('/login'), 1500)
    }
    setLoading(false)
  }

  // Show loading state while checking session
  if (checkingSession) {
    return (
      <RootLayout>
        <Container className="mt-4 sm:mt-8 lg:mt-16">
          <div className="flex flex-col items-center justify-center mx-auto min-h-screen py-4 sm:py-8">
            <FadeIn>
              <div className="w-full max-w-md mx-auto px-4 sm:px-0 bg-white rounded-2xl p-6 sm:p-8">
                <p className="text-center">Verifying reset link...</p>
              </div>
            </FadeIn>
          </div>
        </Container>
      </RootLayout>
    )
  }

  return (
    <RootLayout>
      <Container className="mt-4 sm:mt-8 lg:mt-16">
        <div className="flex flex-col items-center justify-center mx-auto min-h-screen py-4 sm:py-8">
          <FadeIn>
            <div className="w-full max-w-md mx-auto px-4 sm:px-0 bg-white rounded-2xl p-6 sm:p-8">
              <h1 className="text-2xl font-semibold mb-4">Set a new password</h1>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant="default" className="mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Updating...' : 'Update password'}
                </Button>
              </form>
            </div>
          </FadeIn>
        </div>
      </Container>
    </RootLayout>
  )
}


