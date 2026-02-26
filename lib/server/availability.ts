import "server-only";

import { unstable_cache } from "next/cache";
import { createServerClient } from "@supabase/ssr";

const getActiveBookingCountsCached = unstable_cache(
  async (classIdsKey: string): Promise<Record<string, number>> => {
    if (!classIdsKey) return {};

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase environment variables are not configured.");
    }

    const serviceRole = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    });

    const classIds = classIdsKey.split(",").filter(Boolean);
    if (classIds.length === 0) return {};

    const { data, error } = await serviceRole
      .from("Bookings")
      .select("classId")
      .in("classId", classIds)
      .eq("status", "active");

    if (error) {
      throw new Error(error.message);
    }

    const counts: Record<string, number> = {};
    (data ?? []).forEach((row: { classId: string | null }) => {
      if (!row.classId) return;
      counts[row.classId] = (counts[row.classId] ?? 0) + 1;
    });

    return counts;
  },
  ["active-booking-counts-by-class"],
  { revalidate: 15 }
);

export async function getActiveBookingCountsForClassIds(
  classIds: string[]
): Promise<Map<string, number>> {
  const key = classIds.slice().sort().join(",");
  const counts = await getActiveBookingCountsCached(key);
  return new Map(Object.entries(counts));
}
