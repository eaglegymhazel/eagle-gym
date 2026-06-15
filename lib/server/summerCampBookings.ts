import "server-only";

import { unstable_cache } from "next/cache";
import { createServerClient } from "@supabase/ssr";

export type SummerCampSessionRow = {
  id: string;
  slug: string;
  title: string;
  campDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: string;
};

export type SummerCampRegisterStudent = {
  childId: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  pickedUp: string | null;
  photoConsent: boolean | null;
  bookingStatus: string | null;
};

function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}

const getSummerCampSessionsCached = unstable_cache(
  async (slug: string): Promise<SummerCampSessionRow[]> => {
    if (!slug) return [];

    const serviceRole = getServiceRoleClient();
    const { data, error } = await serviceRole
      .from("SummerCampSessions")
      .select('id,slug,title,campDate:"campDate",startTime:"startTime",endTime:"endTime",capacity,status')
      .eq("slug", slug)
      .eq("status", "active")
      .order("campDate", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as SummerCampSessionRow[];
  },
  ["summer-camp-sessions"],
  { revalidate: 30 }
);

export async function getSummerCampSessions(slug: string): Promise<SummerCampSessionRow[]> {
  return getSummerCampSessionsCached(slug);
}

export async function getSummerCampActiveBookingCountsByDate(
  slug: string,
  campDates: string[]
): Promise<Map<string, number>> {
  if (!slug || campDates.length === 0) return new Map();

  const serviceRole = getServiceRoleClient();
  const { data, error } = await serviceRole
    .from("SummerCampBookings")
    .select(
      'campDate:"campDate",status,SummerCampBookingGroups!inner(status,holdExpiresAt:"holdExpiresAt")'
    )
    .eq("slug", slug)
    .in("campDate", campDates)
    .in("status", ["pending", "active"]);

  if (error) throw new Error(error.message);

  const nowIso = new Date().toISOString();
  const counts = new Map<string, number>();
  (data ?? []).forEach((row) => {
    const group = Array.isArray(row.SummerCampBookingGroups)
      ? row.SummerCampBookingGroups[0]
      : row.SummerCampBookingGroups;
    const isLive =
      row.status === "active" ||
      (row.status === "pending" &&
        group?.status === "pending" &&
        !!group.holdExpiresAt &&
        group.holdExpiresAt > nowIso);
    if (!isLive || !row.campDate) return;
    counts.set(row.campDate, (counts.get(row.campDate) ?? 0) + 1);
  });
  return counts;
}

export async function getSummerCampRegisterStudents(params: {
  slug: string;
  campDate: string;
}): Promise<SummerCampRegisterStudent[]> {
  const serviceRole = getServiceRoleClient();
  const { data, error } = await serviceRole
    .from("SummerCampBookings")
    .select(
      'status,Children!inner(id,firstName,lastName,dateOfBirth,pickedUp,photoConsent)'
    )
    .eq("slug", params.slug)
    .eq("campDate", params.campDate)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{
    status: string | null;
    Children:
      | {
          id: string;
          firstName: string | null;
          lastName: string | null;
          dateOfBirth: string | null;
          pickedUp: string | null;
          photoConsent: boolean | null;
        }
      | Array<{
          id: string;
          firstName: string | null;
          lastName: string | null;
          dateOfBirth: string | null;
          pickedUp: string | null;
          photoConsent: boolean | null;
        }>
      | null;
  }>).reduce<SummerCampRegisterStudent[]>((acc, row) => {
    const child = Array.isArray(row.Children) ? row.Children[0] : row.Children;
    if (!child?.id) return acc;
    acc.push({
      childId: child.id,
      firstName: child.firstName ?? null,
      lastName: child.lastName ?? null,
      dateOfBirth: child.dateOfBirth ?? null,
      pickedUp: child.pickedUp ?? null,
      photoConsent: child.photoConsent ?? null,
      bookingStatus: row.status ?? null,
    });
    return acc;
  }, []);
}
