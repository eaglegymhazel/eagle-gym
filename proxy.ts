import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getServerAuthRequestKey,
  logAuthValidation,
} from "@/lib/authValidationDebug";
import {
  SITE_GATE_COOKIE,
  isSiteGateEnabled,
  isValidSiteGateToken,
} from "@/lib/siteGate";

function hasSupabaseAuthCookie(
  cookies: Array<{ name: string; value: string }>
): boolean {
  return cookies.some(({ name, value }) => {
    if (!value) return false;
    return (
      name.startsWith("sb-") ||
      name === "supabase-auth-token" ||
      name.startsWith("supabase-auth-token.")
    );
  });
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  const requestId =
    requestHeaders.get("x-request-id") ?? crypto.randomUUID();
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const isStaticAssetRequest =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.[a-zA-Z0-9]+$/.test(pathname);

  if (isStaticAssetRequest) {
    return response;
  }

  const bypassesSiteGate =
    pathname === "/site-access" ||
    pathname.startsWith("/api/site-gate/") ||
    pathname === "/api/stripe/webhook" ||
    pathname === "/api/sanity/revalidate" ||
    pathname.startsWith("/auth/");

  if (isSiteGateEnabled() && !bypassesSiteGate) {
    const accessCookie = request.cookies.get(SITE_GATE_COOKIE)?.value;
    if (!(await isValidSiteGateToken(accessCookie))) {
      const accessUrl = request.nextUrl.clone();
      accessUrl.pathname = "/site-access";
      accessUrl.search = "";
      accessUrl.searchParams.set(
        "next",
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      );
      return NextResponse.redirect(accessUrl);
    }
  }

  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/studio") ||
    pathname.startsWith("/birthday-party") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/news") ||
    pathname.startsWith("/timetable") ||
    pathname.startsWith("/badge") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/contact");

  if (isPublicRoute) {
    return response;
  }

  const hasOwnAuthCheck =
    pathname.startsWith("/book") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/complete-profile") ||
    pathname.startsWith("/api/account/bootstrap");

  if (hasOwnAuthCheck) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const requestCookies = request.cookies.getAll();
  if (!hasSupabaseAuthCookie(requestCookies)) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  logAuthValidation({
    method: "getUser",
    source: "proxy.ts",
    requestKey: getServerAuthRequestKey(requestHeaders, pathname),
  });
  await supabase.auth.getUser();

  return response;
}
