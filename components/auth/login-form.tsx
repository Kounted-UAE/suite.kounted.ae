'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithOTP, verifyOTP, signInWithPassword } from '@/lib/supabase/auth'
import { Input } from '@/components/react-ui/input'
import { Button } from '@/components/react-ui/button'
import { Label } from '@/components/react-ui/label'
import { Alert, AlertDescription } from '@/components/react-ui/alert'
import { CheckCircle, Circle,AlertCircle, ArrowRight, Mail } from 'lucide-react'
import { KountedLogo} from '@/lib/assets/logos/KountedLogo'
import { FadeIn } from '@/components/react-layout/FadeIn'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [showOTPInput, setShowOTPInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordLogin, setPasswordLogin] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const hasProcessedError = useRef(false)

  // Check for error parameters in URL (e.g., from callback route)
  // Only run once to prevent loops
  useEffect(() => {
    if (hasProcessedError.current) return
    
    const errorParam = searchParams.get('error')
    if (errorParam) {
      hasProcessedError.current = true
      const decodedError = decodeURIComponent(errorParam)
      // Only set error if it's a valid string
      if (decodedError && decodedError !== '{}' && decodedError.trim() !== '') {
        setError(decodedError)
      }
      // Clear the error from URL without triggering navigation
      router.replace('/', { scroll: false })
    }
  }, [searchParams, router])


  const features = [
    { label: 'Payroll Processing', status: 'Live' },
    { label: 'Knowledge Base', status: 'Coming soon' },
    { label: 'Compliance Tools', status: 'Coming soon' },
    { label: 'Client Onboarding', status: 'Coming soon' },
    
  ]
  

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { error: otpError } = await signInWithOTP(email)
      if (otpError) {
        console.error('OTP login error:', otpError)
        setError(otpError.message || 'Failed to send login code. Please try again.')
      } else {
        setSuccess('Login code sent! Check your email.')
        setShowOTPInput(true)
      }
    } catch (err) {
      console.error('Unexpected error in OTP login:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { data, error } = await signInWithPassword(email, password)
      if (error) {
        console.error('Password login error:', error)
        setError(error.message || 'Invalid email or password. Please try again.')
      } else if (data?.user && data?.session) {
        setSuccess('Login successful! Redirecting...')
        setTimeout(() => router.push('/suite'), 1000)
      } else {
        setError('Login failed. Please try again.')
      }
    } catch (err) {
      console.error('Unexpected error in password login:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { data, error: authError } = await verifyOTP(email, otpToken)
      if (authError) {
        console.error('OTP verification error:', authError)
        setError(authError.message || 'Invalid code. Please try again.')
      } else if (data?.user && data?.session) {
        setSuccess('Login successful! Redirecting...')
        setTimeout(() => router.push('/suite'), 1000)
      } else {
        setError('Verification failed. Please try again.')
      }
    } catch (err) {
      console.error('Unexpected error in OTP verification:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetOTPFlow = () => {
    setShowOTPInput(false)
    setOtpToken('')
    setSuccess(null)
    setError(null)
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl p-6 sm:p-8 flex flex-col gap-6 sm:gap-8">
      {/* Header */}
      <FadeIn className="font-display">
        <h1 className="font-display text-2xl font-medium tracking-tight text-balance sm:text-4xl">
          Sign in to our prototype
        </h1>
        <p className="mt-4 sm:mt-6 text-sm sm:text-md text-neutral-600">
          A prototype for staff and independent advisors. Access client records, compliance calendars, payroll, and more.
        </p>
      </FadeIn>

      {/* Alert messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Email form (OTP or Password) or OTP entry form */}
      {!showOTPInput ? (
        <form onSubmit={passwordLogin ? handlePasswordLogin : handleOTPLogin} className="space-y-4 sm:space-y-5">
          <div className="space-y-1">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourfirm.ae"
                className="pl-10 bg-white text-neutral-900 ring-1 ring-zinc-200 focus:ring-zinc-500"
                required
                autoFocus
              />
            </div>
          </div>
          {passwordLogin && (
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm sm:text-base text-neutral-900 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white text-neutral-900 ring-1 ring-zinc-200 focus:ring-zinc-500"
                required
              />
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-zinc-500 hover:bg-zinc-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-sm"
            disabled={loading}
          >
            {loading ? (passwordLogin ? 'Signing in...' : 'Sending OTP...') : (passwordLogin ? 'Sign in' : 'Send login code')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {!passwordLogin ? (
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <p>We'll email you a secure 6-digit code.</p>
              <button type="button" onClick={() => setPasswordLogin(true)} className="underline">
                Use password instead
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Use your email and password to sign in.</span>
              <button type="button" onClick={() => setPasswordLogin(false)} className="underline">
                Use magic code instead
              </button>
            </div>
          )}
          <div className="text-right text-xs">
            <a href="/auth/forgot-password" className="underline text-zinc-500 hover:text-zinc-700">Forgot password?</a>
          </div>
        </form>
      ) : (
        <form onSubmit={handleOTPVerification} className="space-y-4 sm:space-y-5">
          <div className="space-y-1">
            <Label htmlFor="otp" className="text-sm sm:text-base text-neutral-900 font-medium">
              Enter your 6-digit code
            </Label>
            <Input
              id="otp"
              type="text"
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value)}
              placeholder="123456"
              className="text-center text-base tracking-widest text-neutral-900 bg-white ring-1 ring-zinc-200 focus:ring-zinc-500"
              maxLength={6}
              required
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-zinc-500 hover:bg-zinc-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-sm"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={resetOTPFlow}
            className="text-xs text-zinc-400 w-full mt-1"
          >
            ← Back to email entry
          </Button>
        </form>
      )}

      {/* Support info */}
      <p className="text-center text-xs text-zinc-400 mt-2">
        Need help?{' '}
        <a 
          href="mailto:support@kounted.ae" 
          className="text-zinc-500 underline hover:text-zinc-600"
        >
          Contact support
        </a>
      </p>

      {/* Feature Rollout - Hidden on mobile, shown on larger screens */}
      <div className="w-full max-w-2xl mx-auto bg-zinc-100 rounded-2xl px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-4 sm:gap-6">
        <h2 className="text-base sm:text-lg font-semibold text-zinc-600 mb-2 tracking-tight text-center">
          Kounted Feature Rollout
        </h2>
        <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
          {features.map(({ label, status }) => (
            <li key={label} className="flex items-center gap-2">
              {status === 'Live' ? (
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-500" />
              ) : (
                <Circle className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-300" />
              )}
              <span className="text-zinc-700 flex-1">{label}</span>
              <span className="text-xs font-medium rounded px-2 py-0.5">
                {status === 'Live' ? (
                  <span className="text-zinc-500 bg-zinc-50 px-2 rounded font-semibold">Live</span>
                ) : (
                  <span className="text-zinc-400">{status}</span>
                )}
              </span>
            </li>
          ))}
        </ul>        
      </div>
    </div>
  )
}
