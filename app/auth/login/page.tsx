// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { signInWithOtp } from '@/lib/supabase/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSent(false)

    try {
      setLoading(true)
      await signInWithOtp(email)
      setSent(true)
    } catch (err: any) {
      console.error('Supabase login error:', err)
      const message =
        typeof err === 'string'
          ? err
          : err?.message || err?.error_description || 'Something went wrong.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold mb-4">Sign in to our prototype</h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {sent && !error && (
        <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          We&apos;ve sent a login code or link to your email.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium">
          Registered Email Address
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send login code'}
        </button>
      </form>
    </div>
  )
}
