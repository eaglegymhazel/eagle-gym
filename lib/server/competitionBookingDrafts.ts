import "server-only";

import { createServerClient } from "@supabase/ssr";
import {
  buildCompetitionSelectionKey,
  type CompetitionBookingSelection,
} from "../competitionBookingSelection";
import { getCompetitionClasses, type RecreationalClassRow } from "./classes";

type CompetitionBookingDraftRow = {
  id: string;
  accountId: string;
  childId: string;
  selections: unknown;
  created_at: string;
  updated_at: string;
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

function getClassDurationMinutes(row: RecreationalClassRow): number | null {
  return typeof row.durationMinutes === "number" && row.durationMinutes > 0
    ? row.durationMinutes
    : null;
}

function getAllowedDurationOptions(row: RecreationalClassRow): number[] {
  const classDuration = getClassDurationMinutes(row);
  if (classDuration == null) return [];
  if (classDuration === 180) return [120, 180];
  return [classDuration];
}

export async function normalizeCompetitionSelections(
  rawSelections: unknown
): Promise<CompetitionBookingSelection[]> {
  if (!Array.isArray(rawSelections)) {
    return [];
  }

  const classCatalog = await getCompetitionClasses();
  const classById = new Map(classCatalog.map((row) => [row.id, row]));
  const normalized: CompetitionBookingSelection[] = [];
  const seenClassIds = new Set<string>();

  rawSelections.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;

    const classId =
      "classId" in entry && typeof entry.classId === "string"
        ? entry.classId.trim()
        : "";
    const bookedDurationMinutes =
      "bookedDurationMinutes" in entry && typeof entry.bookedDurationMinutes === "number"
        ? entry.bookedDurationMinutes
        : Number.NaN;

    if (!classId || !Number.isFinite(bookedDurationMinutes) || bookedDurationMinutes <= 0) {
      return;
    }

    const row = classById.get(classId);
    if (!row || row.isCompetitionClass !== true) {
      return;
    }

    const allowedDurations = getAllowedDurationOptions(row);
    if (!allowedDurations.includes(bookedDurationMinutes)) {
      return;
    }

    if (seenClassIds.has(classId)) {
      const existingIndex = normalized.findIndex((item) => item.classId === classId);
      if (existingIndex >= 0) {
        normalized[existingIndex] = { classId, bookedDurationMinutes };
      }
      return;
    }

    seenClassIds.add(classId);
    normalized.push({ classId, bookedDurationMinutes });
  });

  return normalized.sort((a, b) =>
    buildCompetitionSelectionKey(a).localeCompare(buildCompetitionSelectionKey(b))
  );
}

export async function getCompetitionBookingDraftById(input: {
  draftId: string;
  accountId: string;
  childId?: string;
}): Promise<{ id: string; childId: string; selections: CompetitionBookingSelection[] } | null> {
  const supabaseAdmin = getServiceRoleClient();
  const { draftId, accountId, childId } = input;

  let query = supabaseAdmin
    .from("CompetitionBookingDrafts")
    .select("id,accountId,childId,selections,created_at,updated_at")
    .eq("id", draftId)
    .eq("accountId", accountId);

  if (childId) {
    query = query.eq("childId", childId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(error.message);
  }

  const row = data as CompetitionBookingDraftRow | null;
  if (!row) return null;

  return {
    id: row.id,
    childId: row.childId,
    selections: await normalizeCompetitionSelections(row.selections),
  };
}

export async function upsertCompetitionBookingDraft(input: {
  accountId: string;
  childId: string;
  selections: CompetitionBookingSelection[];
}): Promise<{ id: string; childId: string; selections: CompetitionBookingSelection[] }> {
  const supabaseAdmin = getServiceRoleClient();
  const normalizedSelections = await normalizeCompetitionSelections(input.selections);

  const { data, error } = await supabaseAdmin
    .from("CompetitionBookingDrafts")
    .upsert(
      {
        accountId: input.accountId,
        childId: input.childId,
        selections: normalizedSelections,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "accountId,childId",
      }
    )
    .select("id,selections")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id as string,
    childId: input.childId,
    selections: await normalizeCompetitionSelections(data.selections),
  };
}
