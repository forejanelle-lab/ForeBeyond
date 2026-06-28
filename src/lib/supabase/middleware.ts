import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";
import { getPostLoginPath } from "@/lib/post-login";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const authRoutes = ["/auth/sign-in", "/auth/sign-up", "/auth/check-email", "/auth/verify-email", "/auth/resend-verification"];
  const protectedRoutes = ["/dashboard", "/verification-center", "/profile", "/settings", "/trust-center/dashboard", "/host", "/saved", "/experiences/saved", "/trips", "/messages", "/notifications", "/admin"];

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
    const url = request.nextUrl.clone();
    const redirect = request.nextUrl.searchParams.get("redirect");

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();

    url.pathname = getPostLoginPath(user.email ?? "", profile, redirect);
    url.search = "";
    return NextResponse.redirect(url);
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
