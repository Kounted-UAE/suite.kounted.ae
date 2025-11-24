'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendResetPasswordEmail } from '@/lib/supabase/auth'
import { Container } from '@/components/react-layout/Container'
import { RootLayout } from '@/components/react-layout/RootLayout'
import { FadeIn } from '@/components/react-layout/FadeIn'
import { Input } from '@/components/react-ui/input'
import { Button } from '@/components/react-ui/button'
import { Label } from '@/components/react-ui/label'
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
    // Redirect to callback route - it will handle code exchange and redirect to reset-password
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await sendResetPasswordEmail(email, redirectTo)
    if (error) setError(error.message)
    else setSuccess('Reset link sent. Check your inbox.')
    setLoading(false)
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
                  <Label htmlFor="email">Email</Label>
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
                <Button type="button" variant="ghost" className="w-full" onClick={() => router.push('/login')}>
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


