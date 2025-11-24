// app/auth/login/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main login page
    router.replace('/')
  }, [router])

  return (
    <div className="mx-auto max-w-md text-center py-8">
      <p className="text-neutral-600">Redirecting to login...</p>
    </div>
  )
}
