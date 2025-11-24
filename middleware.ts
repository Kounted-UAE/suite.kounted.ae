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
    .maybeSingle() // changed from .single() to .maybeSingle()

  // For /suite routes, allow any authenticated user
  if (pathname.startsWith('/suite')) {
    return res
  }

  if (!profile || !profile.is_active) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const role = profile.role_slug

  if (pathname.startsWith("/my-kounted/staff") && !role?.startsWith("kounted-")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  if (pathname.startsWith("/my-kounted/client") && !role?.startsWith("client-")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
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
