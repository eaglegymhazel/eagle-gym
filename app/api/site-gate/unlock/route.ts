import { NextRequest, NextResponse } from "next/server";
import {
  SITE_GATE_COOKIE,
  createSiteGateToken,
  hasSiteGateConfiguration,
  isSiteGateEnabled,
  isValidSiteGatePassword,
} from "@/lib/siteGate";

function getSafeDestination(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/";
  const destination = value.trim();
  if (!destination.startsWith("/") || destination.startsWith("//")) return "/";
  return destination;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password =
    typeof formData.get("password") === "string"
      ? String(formData.get("password"))
      : "";
  const destination = getSafeDestination(formData.get("next"));

  if (!isSiteGateEnabled()) {
    return NextResponse.redirect(new URL(destination, request.url), 303);
  }

  if (!hasSiteGateConfiguration()) {
    const url = new URL("/site-access", request.url);
    url.searchParams.set("error", "configuration");
    url.searchParams.set("next", destination);
    return NextResponse.redirect(url, 303);
  }

  if (!(await isValidSiteGatePassword(password))) {
    const url = new URL("/site-access", request.url);
    url.searchParams.set("error", "password");
    url.searchParams.set("next", destination);
    return NextResponse.redirect(url, 303);
  }

  const token = await createSiteGateToken();
  if (!token) {
    const url = new URL("/site-access", request.url);
    url.searchParams.set("error", "configuration");
    return NextResponse.redirect(url, 303);
  }

  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.cookies.set(SITE_GATE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
