import "server-only";

import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";

type WebAccountRoleRow = {
  role: string | null;
};

function normalizeRole(role: string | null | undefined): string | null {
  const normalized = typeof role === "string" ? role.trim().toLowerCase() : "";
  return normalized || null;
}

export function isAdminRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "admin";
}

export async function getWebAccountRoleForUser(params: {
  authUserId: string;
  email: string | null;
}): Promise<string | null> {
  const { authUserId, email } = params;

  const { data: byAuthUser, error: byAuthUserError } = await supabaseAdmin
    .from("web_accounts")
    .select("role")
    .eq("auth_user_id", authUserId)
    .limit(1);

  if (byAuthUserError) {
    throw new Error(byAuthUserError.message);
  }

  const authUserRole = normalizeRole((byAuthUser as WebAccountRoleRow[] | null)?.[0]?.role);
  if (authUserRole) {
    return authUserRole;
  }

  if (!email) {
    return null;
  }

  const { data: byEmail, error: byEmailError } = await supabaseAdmin
    .from("web_accounts")
    .select("role")
    .eq("email", email)
    .limit(1);

  if (byEmailError) {
    throw new Error(byEmailError.message);
  }

  return normalizeRole((byEmail as WebAccountRoleRow[] | null)?.[0]?.role);
}

export async function getCurrentUserWebAccountRole(): Promise<{
  status: "unauthorized" | "authenticated";
  role: string | null;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { status: "unauthorized", role: null };
  }

  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") ?? "";
  const requestCookies = cookieHeader
    ? cookieHeader
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const index = part.indexOf("=");
          return {
            name: index >= 0 ? part.slice(0, index) : part,
            value: index >= 0 ? part.slice(index + 1) : "",
          };
        })
    : [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll() {},
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { status: "unauthorized", role: null };
  }

  const role = await getWebAccountRoleForUser({
    authUserId: data.user.id,
    email: data.user.email ?? null,
  });

  return {
    status: "authenticated",
    role,
  };
}
