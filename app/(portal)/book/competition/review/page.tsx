import { getBookingContext } from "@/lib/server/bookingContext";
import { getCompetitionClasses } from "@/lib/server/classes";
import { getActiveBookingCountsForClassIds } from "@/lib/server/availability";
import ReviewClient, { type ReviewClassItem } from "./ReviewClient";

type SearchParams = {
  childId?: string;
  classIds?: string;
};

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function parseSelection(rawClassIds: string | undefined) {
  const all = (rawClassIds ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const uniqueIds: string[] = [];
  const seen = new Set<string>();
  all.forEach((id) => {
    if (seen.has(id)) return;
    seen.add(id);
    uniqueIds.push(id);
  });
  return { uniqueIds, hasDuplicates: uniqueIds.length !== all.length };
}

function computeAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasBirthdayPassed) age -= 1;
  return age >= 0 ? age : null;
}

function toNullableNumber(value: number | string | null): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeWeekday(input: string | number | null): string | null {
  if (input == null) return null;
  if (typeof input === "number") {
    if (input >= 1 && input <= 7) return WEEKDAY_ORDER[input - 1];
    if (input >= 0 && input <= 6) {
      const sundayFirst = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ] as const;
      return sundayFirst[input];
    }
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return normalizeWeekday(Number.parseInt(trimmed, 10));
  const normalized = trimmed.toLowerCase();
  const lookup: Record<string, string> = {
    mon: "Monday",
    monday: "Monday",
    tue: "Tuesday",
    tues: "Tuesday",
    tuesday: "Tuesday",
    wed: "Wednesday",
    wednesday: "Wednesday",
    thu: "Thursday",
    thur: "Thursday",
    thurs: "Thursday",
    thursday: "Thursday",
    fri: "Friday",
    friday: "Friday",
    sat: "Saturday",
    saturday: "Saturday",
    sun: "Sunday",
    sunday: "Sunday",
  };
  return lookup[normalized] ?? null;
}

function buildBackHref(childId: string | undefined, classIds: string[]) {
  if (!childId) return "/book/competition";
  const ids = classIds.join(",");
  return `/book/competition?childId=${encodeURIComponent(childId)}${
    ids ? `&classIds=${encodeURIComponent(ids)}` : ""
  }`;
}

function ErrorState({
  title,
  message,
  backHref,
  retryHref,
}: {
  title: string;
  message: string;
  backHref: string;
  retryHref?: string;
}) {
  return (
    <section className="w-full bg-[#faf7fb] px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[#f3ccd5] bg-[#fff5f7] p-6 shadow-[0_14px_30px_-24px_rgba(42,32,60,0.42)]">
        <h1 className="text-2xl font-black tracking-tight text-[#7b2437] sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-[#7b2437]/80 sm:text-base">{message}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {retryHref ? (
            <a
              href={retryHref}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#6e2ac0] px-5 text-sm font-semibold text-white transition hover:bg-[#6325ad]"
            >
              Retry
            </a>
          ) : null}
          <a
            href={backHref}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8c7f4] bg-white px-5 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
          >
            Back to timetable
          </a>
        </div>
      </div>
    </section>
  );
}

export default async function CompetitionReviewPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const childId = resolvedSearchParams?.childId;
  const parsedSelection = parseSelection(resolvedSearchParams?.classIds);
  const showDebug = process.env.NODE_ENV !== "production";

  if (!childId) {
    return (
      <ErrorState
        title="Missing child selection"
        message="We couldn't identify which child this booking is for. Please return to the timetable and select a child."
        backHref="/book/competition"
      />
    );
  }

  const bookingContext = await getBookingContext();
  if (bookingContext.status !== "existing") {
    return (
      <ErrorState
        title="Unable to load booking details"
        message="There was a problem loading your account details. Please try again."
        backHref={buildBackHref(childId, parsedSelection.uniqueIds)}
      />
    );
  }

  const classCatalog = await getCompetitionClasses();
  const children = bookingContext.children;
  const child = children.find((item) => item.id === childId);

  if (!child?.id) {
    return (
      <ErrorState
        title="Child not found"
        message="This child could not be found in your account. Please return to the timetable and select a child again."
        backHref="/book"
      />
    );
  }

  const childName = `${child.firstName ?? ""} ${child.lastName ?? ""}`.trim();
  const childAge = computeAge(child.dateOfBirth ?? null);

  if (parsedSelection.uniqueIds.length === 0) {
    return (
      <ReviewClient
        childId={childId}
        childName={childName || "Selected child"}
        initialItems={[]}
        initialBackHref={buildBackHref(childId, [])}
        hasDuplicateSelections={parsedSelection.hasDuplicates}
        showDebug={showDebug}
      />
    );
  }

  const classById = new Map(classCatalog.map((row) => [row.id, row]));
  const rows = parsedSelection.uniqueIds
    .map((id) => classById.get(id))
    .filter((row): row is NonNullable<typeof row> => !!row);
  const classIdsFromRows = rows.map((row) => row.id);
  const bookingCountsByClassId = await getActiveBookingCountsForClassIds(classIdsFromRows);

  const rowById = new Map(rows.map((row) => [row.id, row]));
  const reviewItems: ReviewClassItem[] = parsedSelection.uniqueIds.map((id) => {
    const row = rowById.get(id);
    if (!row) {
      return {
        id,
        name: "No longer available",
        weekday: "Unknown day",
        startTime: "",
        endTime: "",
        durationMinutes: null,
        spotsLeft: 0,
        isCompetitionClass: true,
        isUnavailable: true,
        ageInvalid: false,
      } satisfies ReviewClassItem;
    }

    const capacity = typeof row.capacity === "number" ? row.capacity : null;
    const spotsTaken = bookingCountsByClassId.get(row.id) ?? 0;
    const spotsLeft = capacity == null ? null : Math.max(0, capacity - spotsTaken);
    const minAge = toNullableNumber(row.minAge);
    const maxAge = toNullableNumber(row.maxAge);
    const ageInvalid =
      childAge != null && minAge != null && maxAge != null
        ? !(minAge <= childAge && childAge <= maxAge)
        : false;

    return {
      id: row.id,
      name: row.name ?? "Unnamed class",
      weekday: normalizeWeekday(row.weekday) ?? "Unknown day",
      startTime: row.startTime ?? "",
      endTime: row.endTime ?? "",
      durationMinutes: typeof row.durationMinutes === "number" ? row.durationMinutes : null,
      spotsLeft,
      isCompetitionClass: !!row.isCompetitionClass,
      isUnavailable: spotsLeft != null && spotsLeft <= 0,
      ageInvalid,
    } satisfies ReviewClassItem;
  });

  return (
    <ReviewClient
      childId={childId}
      childName={childName || "Selected child"}
      initialItems={reviewItems}
      initialBackHref={buildBackHref(
        childId,
        reviewItems.map((item) => item.id)
      )}
      hasDuplicateSelections={parsedSelection.hasDuplicates}
      showDebug={showDebug}
    />
  );
}

