import "server-only";

import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { cache } from "react";
import {
  getServerAuthRequestKey,
  logAuthValidation,
} from "../authValidationDebug";
import { getChildrenForAccount, type ChildSummary } from "./children";

type WebAccountRow = {
  id: string;
  auth_user_id: string;
  email: string | null;
  account_id: string | null;
};

export type BookingContextResult =
  | { status: "unauthorized" }
  | { status: "missing" }
  | {
      status: "existing";
      accountId: string;
      children: ChildSummary[];
    };

function toCookieArray(cookieHeader: string): Array<{ name: string; value: string }> {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf("=");
      const name = index >= 0 ? part.slice(0, index) : part;
      const value = index >= 0 ? part.slice(index + 1) : "";
      return { name, value };
    });
}

export const getBookingContext = cache(
  async (): Promise<BookingContextResult> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return { status: "unauthorized" };
  }

  const headersList = headers();
  const resolvedHeaders =
    typeof (headersList as unknown as Promise<Headers>).then === "function"
      ? await (headersList as Promise<Headers>)
      : (headersList as Headers);
  const cookieHeader =
    typeof (resolvedHeaders as Headers).get === "function"
      ? resolvedHeaders.get("cookie") ?? ""
      : "";
  const requestCookies = toCookieArray(cookieHeader);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll() {},
    },
  });

  logAuthValidation({
    method: "getUser",
    source: "lib/server/bookingContext.ts",
    requestKey: getServerAuthRequestKey(resolvedHeaders as Headers, "/book"),
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { status: "unauthorized" };
  }

  const authUserId = data.user.id;
  let email = data.user.email;

  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_IMPERSONATE_EMAIL
  ) {
    email = process.env.DEV_IMPERSONATE_EMAIL;
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.DEV_IMPERSONATE_EMAIL
  ) {
    throw new Error("DEV_IMPERSONATE_EMAIL must not be set in production");
  }

  const serviceRole = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });

  let webAccount: WebAccountRow | null = null;
  const { data: webAccountData, error: webAccountError } = await serviceRole
    .from("web_accounts")
    .select("id,auth_user_id,email,account_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (webAccountError) {
    throw new Error(webAccountError.message);
  }

  webAccount = webAccountData ?? null;

  if (!webAccount) {
    const { data: inserted, error: insertError } = await serviceRole
      .from("web_accounts")
      .insert({
        auth_user_id: authUserId,
        email,
      })
      .select("id,auth_user_id,email,account_id")
      .maybeSingle();

    if (insertError) {
      throw new Error(insertError.message);
    }

    webAccount = inserted ?? {
      id: "",
      auth_user_id: authUserId,
      email,
      account_id: null,
    };
  }

  if (!webAccount.account_id) {
    const { data: legacyAccount, error: legacyError } = await serviceRole
      .from("Accounts")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (legacyError) {
      if (legacyError.code === "PGRST116") {
        throw new Error("Multiple accounts found for this email.");
      }
      throw new Error(legacyError.message);
    }

    if (!legacyAccount?.id) {
      return { status: "missing" };
    }

    const { error: updateError } = await serviceRole
      .from("web_accounts")
      .update({ account_id: legacyAccount.id })
      .eq("auth_user_id", authUserId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    webAccount = {
      ...webAccount,
      account_id: legacyAccount.id,
    };
  }

  if (!webAccount.account_id) {
    return { status: "missing" };
  }

  const children = await getChildrenForAccount(webAccount.account_id);

  return {
    status: "existing",
    accountId: webAccount.account_id,
    children,
  };
  }
);
