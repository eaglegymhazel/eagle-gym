import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getServerAuthRequestKey,
  logAuthValidation,
} from "@/lib/authValidationDebug";

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

  const isPublicRoute =
    pathname === "/" ||
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

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
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
