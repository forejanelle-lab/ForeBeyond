import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";
import { getPostLoginPath } from "@/lib/post-login";
import {
  isProfileCompletionAllowlisted,
  needsProfileCompletion,
  PROFILE_COMPLETE_PATH,
} from "@/lib/profile-completion";
import { isHostOnboardingAllowlisted, needsHostOnboarding, HOST_ONBOARDING_PATH } from "@/lib/host-onboarding";

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("middleware getUser failed:", error.message);
    } else {
      user = data.user;
    }
  } catch (err) {
    console.error("middleware getUser unreachable:", err);
    return supabaseResponse;
  }

  const pathname = request.nextUrl.pathname;

  const authRoutes = ["/auth/sign-in", "/auth/sign-up", "/auth/check-email", "/auth/verify-email", "/auth/resend-verification", "/auth/forgot-password", "/auth/reset-password"];
  const authRoutesAllowedWhenLoggedIn = ["/auth/forgot-password", "/auth/reset-password"];
  const protectedRoutes = ["/dashboard", "/verification-center", "/profile", "/settings", "/trust-center/dashboard", "/host", "/saved", "/experiences/saved", "/trips", "/messages", "/notifications", "/admin", "/onboarding"];

  if (pathname === "/auth/callback") {
    return supabaseResponse;
  }

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute && pathname !== "/auth/verify-email") {
    if (authRoutesAllowedWhenLoggedIn.some((route) => pathname.startsWith(route))) {
      return supabaseResponse;
    }

    const url = request.nextUrl.clone();
    const redirect = request.nextUrl.searchParams.get("redirect");

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role, onboarding_step, onboarding_complete")
      .eq("id", user.id)
      .single();

    if (needsProfileCompletion(user.email ?? "", profile)) {
      url.pathname = PROFILE_COMPLETE_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (needsHostOnboarding(profile) && !isHostOnboardingAllowlisted(pathname)) {
      url.pathname = HOST_ONBOARDING_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }

    url.pathname = getPostLoginPath(user.email ?? "", profile, redirect);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    !isProfileCompletionAllowlisted(pathname) &&
    pathname !== "/auth/callback"
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role, onboarding_step, onboarding_complete")
      .eq("id", user.id)
      .single();

    if (needsProfileCompletion(user.email ?? "", profile)) {
      const url = request.nextUrl.clone();
      url.pathname = PROFILE_COMPLETE_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (needsHostOnboarding(profile) && !isHostOnboardingAllowlisted(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = HOST_ONBOARDING_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const skipActivity =
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next");

  if (user && !skipActivity) {
    void supabase.rpc("touch_user_activity", { p_user_id: user.id });
  }

  return supabaseResponse;
}
