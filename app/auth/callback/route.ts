import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  // If code is missing, redirect safely to login page
  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_code", request.url)
    );
  }

  const cookieStore = await cookies();

  // Determine redirect path based on auth type (before creating response)
  let redirectPath = "/suite"; // default dashboard route

  switch (type) {
    case "recovery":
    case "password_reset":
      // Pass code to reset-password page for password reset flow
      redirectPath = `/auth/reset-password?code=${encodeURIComponent(code)}`;
      break;

    case "signup":
    case "invite":
    case "email_change":
    case "magiclink":
    case "sso":
      // On success, redirect to main suite/dashboard
      redirectPath = "/suite";
      break;

    case "reauthentication":
      // OTP reauth typically just returns to the app
      redirectPath = "/suite";
      break;

    default:
      // Default to suite for any other type or no type specified
      redirectPath = "/suite";
      break;
  }

  // Create response with redirect (needed for cookie setting)
  const response = NextResponse.redirect(new URL(redirectPath, request.url));

  // Create Supabase server client with cookie handlers
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Exchange code for session
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Error exchanging code for session:", error);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return response;
}
