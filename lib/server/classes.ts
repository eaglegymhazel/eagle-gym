import "server-only";

import { unstable_cache } from "next/cache";
import { createServerClient } from "@supabase/ssr";

export type RecreationalClassRow = {
  id: string;
  name: string | null;
  weekday: string | number | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  minAge: number | string | null;
  maxAge: number | string | null;
  capacity: number | null;
  isCompetitionClass: boolean | null;
};

const getRecreationalClassesCached = unstable_cache(
  async (): Promise<RecreationalClassRow[]> => {
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

    const { data, error } = await serviceRole
      .from("Classes")
      .select(
        "id,name:className,weekday,startTime,endTime,durationMinutes,minAge:ageMin,maxAge:ageMax,capacity,isCompetitionClass"
      )
      .eq("isCompetitionClass", false);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as RecreationalClassRow[];
  },
  ["recreational-classes-catalog"],
  { revalidate: 60 }
);

export async function getRecreationalClasses(): Promise<RecreationalClassRow[]> {
  return getRecreationalClassesCached();
}

const getCompetitionClassesCached = unstable_cache(
  async (): Promise<RecreationalClassRow[]> => {
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

    const { data, error } = await serviceRole
      .from("Classes")
      .select(
        "id,name:className,weekday,startTime,endTime,durationMinutes,minAge:ageMin,maxAge:ageMax,capacity,isCompetitionClass"
      )
      .eq("isCompetitionClass", true);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as RecreationalClassRow[];
  },
  ["competition-classes-catalog"],
  { revalidate: 60 }
);

export async function getCompetitionClasses(): Promise<RecreationalClassRow[]> {
  return getCompetitionClassesCached();
}
