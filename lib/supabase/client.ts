// lib/supabase/client.ts
import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/supabase'

// Singleton instance
let browserClient: SupabaseClient<Database> | null = null

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient must be called in the browser')
  }

  // Return existing instance if already created
  if (browserClient) {
    return browserClient
  }

  // Create new instance only once
  browserClient = createBrowserClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      auth: {
        persistSession: true,
        storage: localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-client-info': 'kounted-business-suite',
        },
      },
    }
  )

  return browserClient
}
