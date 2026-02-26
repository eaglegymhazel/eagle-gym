import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
import { isBeforeSaveWindow, isRegisterLocked } from "@/lib/server/registerLock";

type SaveEntryInput = {
  childId: string;
  isPresent: boolean;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

function toRequiresPickup(pickedUp: string | null | undefined): boolean {
  return (pickedUp ?? "").trim().toLowerCase() !== "yes";
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const cookieStore = request.cookies;
    const cookiesToPersist: Array<{
      name: string;
      value: string;
      options?: Parameters<typeof cookieStore.set>[2];
    }> = [];
    const applyCookies = (response: NextResponse) => {
      cookiesToPersist.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    };

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => cookiesToPersist.push(cookie));
        },
      },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }

    const payload = (await request.json()) as {
      classId?: unknown;
      sessionDate?: unknown;
      entries?: unknown;
    };

    const classId = typeof payload.classId === "string" ? payload.classId.trim() : "";
    const sessionDate =
      typeof payload.sessionDate === "string" ? payload.sessionDate.trim() : "";
    const entries = Array.isArray(payload.entries) ? payload.entries : [];

    if (!isUuid(classId)) {
      return NextResponse.json({ error: "Invalid classId" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
      return NextResponse.json({ error: "Invalid sessionDate" }, { status: 400 });
    }
    if (entries.length < 1) {
      return NextResponse.json({ error: "entries must be non-empty" }, { status: 400 });
    }

    const parsedEntries: SaveEntryInput[] = [];
    const childIdSet = new Set<string>();
    for (const row of entries) {
      const childId =
        row && typeof row === "object" && typeof (row as { childId?: unknown }).childId === "string"
          ? (row as { childId: string }).childId.trim()
          : "";
      const isPresent =
        row && typeof row === "object" ? (row as { isPresent?: unknown }).isPresent : undefined;

      if (!isUuid(childId)) {
        return NextResponse.json({ error: "Invalid childId in entries" }, { status: 400 });
      }
      if (typeof isPresent !== "boolean") {
        return NextResponse.json({ error: "Invalid isPresent in entries" }, { status: 400 });
      }
      if (childIdSet.has(childId)) {
        return NextResponse.json({ error: "Duplicate childId in entries" }, { status: 400 });
      }
      childIdSet.add(childId);
      parsedEntries.push({ childId, isPresent });
    }

    const { data: webAccount, error: webAccountError } = await supabaseAdmin
      .from("web_accounts")
      .select("role,email")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();

    if (webAccountError || !webAccount) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const role = String(webAccount.role ?? "").trim().toLowerCase();
    if (role !== "admin" && role !== "coach") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: classRow, error: classError } = await supabaseAdmin
      .from("Classes")
      .select("id,startTime,endTime,durationMinutes")
      .eq("id", classId)
      .maybeSingle();

    if (classError) {
      return NextResponse.json({ error: classError.message }, { status: 500 });
    }
    if (!classRow) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const locked = isRegisterLocked({
      sessionDate,
      startTime: classRow.startTime ?? null,
      endTime: classRow.endTime ?? null,
      durationMinutes: classRow.durationMinutes ?? null,
      lockHours: 12,
    });
    if (locked) {
      return NextResponse.json(
        { error: "Register is locked and can no longer be edited." },
        { status: 423 }
      );
    }

    const beforeSaveWindow = isBeforeSaveWindow({
      sessionDate,
      startTime: classRow.startTime ?? null,
      endTime: classRow.endTime ?? null,
      leadMinutes: 15,
    });
    if (beforeSaveWindow) {
      return NextResponse.json(
        { error: "Register can be saved from 15 minutes before class start." },
        { status: 409 }
      );
    }

    const accountEmail =
      authData.user.email?.trim() ||
      (typeof webAccount.email === "string" ? webAccount.email.trim() : "");
    if (!accountEmail) {
      return NextResponse.json({ error: "Missing account email for user" }, { status: 400 });
    }

    const { data: accountRow, error: accountError } = await supabaseAdmin
      .from("Accounts")
      .select("id")
      .eq("email", accountEmail)
      .maybeSingle();

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 500 });
    }
    const takenByAccountId =
      accountRow && typeof accountRow.id === "string" ? accountRow.id.trim() : "";
    if (!isUuid(takenByAccountId)) {
      return NextResponse.json({ error: "No linked Accounts row for this user" }, { status: 400 });
    }

    const childIds = parsedEntries.map((entry) => entry.childId);
    const { data: childRows, error: childError } = await supabaseAdmin
      .from("Children")
      .select("id,pickedUp")
      .in("id", childIds);

    if (childError) {
      return NextResponse.json({ error: childError.message }, { status: 500 });
    }

    const pickupByChildId = new Map<string, boolean>();
    (childRows ?? []).forEach((row: { id: string; pickedUp: string | null }) => {
      pickupByChildId.set(row.id, toRequiresPickup(row.pickedUp));
    });

    if (pickupByChildId.size !== childIds.length) {
      return NextResponse.json({ error: "One or more childIds were not found" }, { status: 400 });
    }

    const presentCount = parsedEntries.filter((entry) => entry.isPresent).length;
    const absentCount = parsedEntries.length - presentCount;
    const rpcEntries = parsedEntries.map((entry) => ({
      childId: entry.childId,
      isPresent: entry.isPresent,
      requiresPickup: pickupByChildId.get(entry.childId) ?? true,
    }));

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "save_class_register_atomic",
      {
        p_class_id: classId,
        p_session_date: sessionDate,
        p_taken_by_account_id: takenByAccountId,
        p_present_count: presentCount,
        p_absent_count: absentCount,
        p_entries: rpcEntries,
      }
    );

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
    const registerId =
      row && typeof row === "object" && "register_id" in row
        ? String((row as { register_id: string }).register_id)
        : "";

    return NextResponse.json({
      ok: true,
      registerId,
      presentCount,
      absentCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
