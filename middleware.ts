// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "./lib/types/supabase"

const PUBLIC_ROUTES = ["/", "/login", "/auth/login", "/auth/callback", "/auth/forgot-password", "/auth/reset-password"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  const res = NextResponse.next()

  const supabase = createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const { data: profile } = await supabase
    .from("v_authenticated_profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (!profile || !profile.is_active) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const role = profile.role_slug

  // Check admin routes - require admin or superadmin role
  if (pathname.startsWith("/suite/admin")) {
    const isAdmin = role === 'kounted-superadmin' || role === 'kounted-admin'
    if (!isAdmin) {
      console.warn(`User ${user.email} (${role}) attempted to access admin route: ${pathname}`)
      return NextResponse.redirect(new URL("/suite?error=unauthorized", req.url))
    }
  }

  // For other /suite routes, allow any authenticated user
  if (pathname.startsWith('/suite')) {
    return res
  }

  // Check my-kounted routes
  if (pathname.startsWith("/my-kounted/staff") && !role?.startsWith("kounted-")) {
    return NextResponse.redirect(new URL("/suite?error=unauthorized", req.url))
  }

  if (pathname.startsWith("/my-kounted/client") && !role?.startsWith("client-")) {
    return NextResponse.redirect(new URL("/suite?error=unauthorized", req.url))
  }

  return res
}

export const config = {
  matcher: [
    "/my-kounted/:path*",
    "/admin/:path*",
    "/suite/:path*",
  ],
}

// Export types for use in other files
export type { Database } from "./lib/types/supabase"
