import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
import { isBeforeSaveWindow, isRegisterLocked, shouldBypassSaveWindow } from "@/lib/server/registerLock";
import { getWebAccountAccessForUser, isAdminRole } from "@/lib/server/webAccountRole";

type SaveEntryInput = {
  childId: string;
  isPresent: boolean;
  isCollected: boolean | null;
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
    const cookiesToPersist: Array<{ name: string; value: string; options?: CookieOptions }> = [];
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
        setAll(cookies: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookies.forEach((cookie) => cookiesToPersist.push(cookie));
        },
      },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }

    const payload = (await request.json()) as {
      slug?: unknown;
      campDate?: unknown;
      entries?: unknown;
    };

    const slug = typeof payload.slug === "string" ? payload.slug.trim() : "";
    const campDate = typeof payload.campDate === "string" ? payload.campDate.trim() : "";
    const entries = Array.isArray(payload.entries) ? payload.entries : [];

    if (!slug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(campDate)) {
      return NextResponse.json({ error: "Invalid campDate" }, { status: 400 });
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
      const isCollected =
        row && typeof row === "object" ? (row as { isCollected?: unknown }).isCollected : null;

      if (!isUuid(childId)) {
        return NextResponse.json({ error: "Invalid childId in entries" }, { status: 400 });
      }
      if (typeof isPresent !== "boolean") {
        return NextResponse.json({ error: "Invalid isPresent in entries" }, { status: 400 });
      }
      if (isCollected !== null && typeof isCollected !== "boolean") {
        return NextResponse.json({ error: "Invalid isCollected in entries" }, { status: 400 });
      }
      if (childIdSet.has(childId)) {
        return NextResponse.json({ error: "Duplicate childId in entries" }, { status: 400 });
      }
      childIdSet.add(childId);
      parsedEntries.push({ childId, isPresent, isCollected });
    }

    const access = await getWebAccountAccessForUser({
      authUserId: authData.user.id,
    });
    if (!isAdminRole(access.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!access.accountId || !isUuid(access.accountId)) {
      return NextResponse.json(
        { error: "No linked Accounts row for this user" },
        { status: 400 }
      );
    }

    const { data: sessionRow, error: sessionError } = await supabaseAdmin
      .from("SummerCampSessions")
      .select('slug,campDate:"campDate",startTime:"startTime",endTime:"endTime"')
      .eq("slug", slug)
      .eq("campDate", campDate)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }
    if (!sessionRow) {
      return NextResponse.json({ error: "Summer camp session not found" }, { status: 404 });
    }

    const locked = isRegisterLocked({
      sessionDate: campDate,
      startTime: sessionRow.startTime ?? null,
      endTime: sessionRow.endTime ?? null,
      durationMinutes: null,
      lockHours: 12,
    });
    if (locked) {
      return NextResponse.json(
        { error: "Register is locked and can no longer be edited." },
        { status: 423 }
      );
    }

    const beforeSaveWindow = shouldBypassSaveWindow()
      ? false
      : isBeforeSaveWindow({
          sessionDate: campDate,
          startTime: sessionRow.startTime ?? null,
          endTime: sessionRow.endTime ?? null,
          leadMinutes: 15,
        });
    if (beforeSaveWindow) {
      return NextResponse.json(
        { error: "Register can be saved from 15 minutes before camp starts." },
        { status: 409 }
      );
    }

    const takenByAccountId = access.accountId;

    const childIds = parsedEntries.map((entry) => entry.childId);
    const pickupByChildId = new Map<string, boolean>();
    if (childIds.length > 0) {
      const { data: activeBookingRows, error: activeBookingError } = await supabaseAdmin
        .from("SummerCampBookings")
        .select('childId:"childId"')
        .eq("slug", slug)
        .eq("campDate", campDate)
        .eq("status", "active")
        .in("childId", childIds);

      if (activeBookingError) {
        return NextResponse.json({ error: activeBookingError.message }, { status: 500 });
      }

      const activeChildIds = new Set(
        ((activeBookingRows ?? []) as Array<{ childId: string }>).map((row) => row.childId)
      );
      if (activeChildIds.size !== childIds.length) {
        return NextResponse.json(
          { error: "One or more students are not actively booked for this camp date." },
          { status: 400 }
        );
      }

      const { data: childRows, error: childError } = await supabaseAdmin
        .from("Children")
        .select("id,pickedUp")
        .in("id", childIds);

      if (childError) {
        return NextResponse.json({ error: childError.message }, { status: 500 });
      }

      (childRows ?? []).forEach((row: { id: string; pickedUp: string | null }) => {
        pickupByChildId.set(row.id, toRequiresPickup(row.pickedUp));
      });
      if (pickupByChildId.size !== childIds.length) {
        return NextResponse.json({ error: "One or more childIds were not found" }, { status: 400 });
      }
    }

    const presentCount = parsedEntries.filter((entry) => entry.isPresent).length;
    const absentCount = parsedEntries.length - presentCount;
    const rpcEntries = parsedEntries.map((entry) => ({
      childId: entry.childId,
      isPresent: entry.isPresent,
      requiresPickup: pickupByChildId.get(entry.childId) ?? true,
      isCollected: entry.isCollected === true,
    }));

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "save_summer_camp_register_atomic",
      {
        p_slug: slug,
        p_camp_date: campDate,
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
