'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendResetPasswordEmail } from '@/lib/supabase/auth'
import { Container } from '@/components/react-layout/Container'
import { RootLayout } from '@/components/react-layout/RootLayout'
import { FadeIn } from '@/components/react-layout/FadeIn'
import { Input } from '@/components/react-ui/input'
import { Button } from '@/components/react-ui/button'
import { Alert, AlertDescription } from '@/components/react-ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Redirect to callback route - it will handle code exchange and redirect to reset-password
      // Supabase will automatically add type=recovery to the callback URL
      const redirectTo = `${window.location.origin}/auth/callback`
      const { error } = await sendResetPasswordEmail(email, redirectTo)
      
      if (error) {
        console.error('Password reset error:', error)
        // Provide user-friendly error messages
        let errorMessage = error.message || 'Failed to send reset email. Please try again.'
        
        if (error.message?.includes('timeout') || error.message?.includes('deadline')) {
          errorMessage = 'The request timed out. The server is experiencing high load. Please try again in a moment.'
        } else if (error.message?.includes('504')) {
          errorMessage = 'The server is taking longer than expected. Please try again.'
        }
        
        setError(errorMessage)
      } else {
        setSuccess('Reset link sent. Check your inbox.')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <RootLayout>
      <Container className="mt-4 sm:mt-8 lg:mt-16">
        <div className="flex flex-col items-center justify-center mx-auto min-h-screen py-4 sm:py-8">
          <FadeIn>
            <div className="w-full max-w-md mx-auto px-4 sm:px-0 bg-white rounded-2xl p-6 sm:p-8">
              <h1 className="text-2xl font-semibold mb-4">Forgot password</h1>
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
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourfirm.ae"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => router.push('/auth/login')}>
                  Back to login
                </Button>
              </form>
            </div>
          </FadeIn>
        </div>
      </Container>
    </RootLayout>
  )
}


