import RegisterSheetClient from "./RegisterSheetClient";
import { supabaseAdmin } from "@/lib/admin";
import { isBeforeSaveWindow, isRegisterLocked } from "@/lib/server/registerLock";

type RegisterDetailPageProps = {
  params: Promise<{ classId: string }>;
  searchParams?: Promise<{ date?: string | string[] }>;
};

type ClassRow = {
  id: string;
  className: string | null;
  weekday: string | number | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  ageMin: number | string | null;
  ageMax: number | string | null;
  isCompetitionClass: boolean | null;
};

type BookingRow = {
  childId: string | null;
};

type ChildRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  pickedUp: string | null;
};

type RegisterHeaderRow = {
  id: string;
};

type RegisterEntryRow = {
  childId: string;
  isPresent: boolean;
};

const ACTIVE_BOOKING_STATUSES = ["active", "confirmed", "current"] as const;

function toNullableNumber(value: number | string | null): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toAgeBand(min: number | string | null, max: number | string | null): string {
  const minVal = toNullableNumber(min);
  const maxVal = toNullableNumber(max);
  if (minVal == null && maxVal == null) return "All ages";
  if (minVal != null && maxVal != null) return `${minVal}-${maxVal}yrs`;
  if (minVal != null) return `${minVal}+yrs`;
  return `Up to ${maxVal}yrs`;
}

function normalizeWeekday(value: string | number | null): string {
  if (typeof value === "string" && value.trim()) {
    const raw = value.trim().toLowerCase();
    const map: Record<string, string> = {
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
    return map[raw] ?? value.trim();
  }
  if (typeof value === "number") {
    const mondayFirst = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    if (value >= 1 && value <= 7) return mondayFirst[value - 1];
    const sundayFirst = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    if (value >= 0 && value <= 6) return sundayFirst[value];
  }
  return "-";
}

function formatTime(value: string | null): string {
  if (!value) return "--:--";
  const date = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDob(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "-";
  const date = new Date(dateOfBirth);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toRequiresPickup(pickedUp: string | null | undefined): boolean {
  const normalized = (pickedUp ?? "").trim().toLowerCase();
  if (normalized === "yes") return false;
  if (normalized === "no") return true;
  return true;
}

function toRegisterDate(dateParam: string | string[] | undefined): Date {
  const value = Array.isArray(dateParam) ? dateParam[0] : dateParam;
  if (!value) return new Date();
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
}

function formatRegisterDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatSessionDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTitleTime(value: string | null): string {
  if (!value) return "--";
  const date = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(":00", "")
    .replace(" ", "")
    .toLowerCase();
}

export default async function RegisterDetailPage({
  params,
  searchParams,
}: RegisterDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const classId = resolvedParams.classId;

  const { data: classRow } = await supabaseAdmin
    .from("Classes")
    .select(
      "id,className,weekday,startTime,endTime,durationMinutes,ageMin,ageMax,isCompetitionClass"
    )
    .eq("id", classId)
    .maybeSingle();

  const classData = (classRow ?? null) as ClassRow | null;

  const { data: bookingRows } = await supabaseAdmin
    .from("Bookings")
    .select("childId")
    .eq("classId", classId)
    .in("status", [...ACTIVE_BOOKING_STATUSES]);

  const activeBookings = (bookingRows ?? []) as BookingRow[];
  const childIds = [...new Set(activeBookings.map((row) => row.childId).filter(Boolean))] as string[];

  let childrenById = new Map<string, ChildRow>();
  if (childIds.length > 0) {
    const { data: childRows } = await supabaseAdmin
      .from("Children")
      .select("id,firstName,lastName,dateOfBirth,pickedUp")
      .in("id", childIds);

    childrenById = new Map(((childRows ?? []) as ChildRow[]).map((child) => [child.id, child]));
  }

  const students = childIds
    .map((childId) => {
      const child = childrenById.get(childId);
      const firstName = child?.firstName?.trim() || "";
      const lastName = child?.lastName?.trim() || "";
      return {
        id: childId,
        fullName: `${firstName} ${lastName}`.trim() || "Unknown student",
        dateOfBirthLabel: formatDob(child?.dateOfBirth ?? null),
        requiresPickup: toRequiresPickup(child?.pickedUp),
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "en-GB"));

  const programme = classData?.isCompetitionClass ? "Competition" : "Recreational";
  const ageBandLabel = classData
    ? toAgeBand(classData.ageMin, classData.ageMax)
    : null;
  const weekdayLabel = normalizeWeekday(classData?.weekday ?? null);
  const scheduleLabel = `${formatTime(
    classData?.startTime ?? null
  )}-${formatTime(classData?.endTime ?? null)}`;
  const registerDate = toRegisterDate(resolvedSearchParams?.date);
  const registerDateLabel = formatRegisterDate(registerDate);
  const sessionDate = formatSessionDateIso(registerDate);
  const isLocked = isRegisterLocked({
    sessionDate,
    startTime: classData?.startTime ?? null,
    endTime: classData?.endTime ?? null,
    durationMinutes: classData?.durationMinutes ?? null,
    lockHours: 12,
  });
  const beforeSaveWindow = isBeforeSaveWindow({
    sessionDate,
    startTime: classData?.startTime ?? null,
    endTime: classData?.endTime ?? null,
    leadMinutes: 15,
  });

  const { data: registerHeader } = await supabaseAdmin
    .from("ClassRegisters")
    .select("id")
    .eq("classId", classId)
    .eq("sessionDate", sessionDate)
    .maybeSingle();

  const registerId =
    ((registerHeader ?? null) as RegisterHeaderRow | null)?.id ?? null;

  const initialStatuses: Record<string, "present" | "absent"> = {};
  if (registerId) {
    const { data: entryRows } = await supabaseAdmin
      .from("ClassRegisterEntries")
      .select("childId,isPresent")
      .eq("registerId", registerId);

    ((entryRows ?? []) as RegisterEntryRow[]).forEach((row) => {
      initialStatuses[row.childId] = row.isPresent ? "present" : "absent";
    });
  }
  const titleLabel = `${weekdayLabel} ${formatTitleTime(classData?.startTime ?? null)} ${programme}`;
  const contextLabel =
    programme === "Competition" || !ageBandLabel
      ? scheduleLabel
      : `Ages ${ageBandLabel} \u2022 ${scheduleLabel}`;
  const registerLabel = `Register for ${registerDateLabel}`;

  return (
    <RegisterSheetClient
      classId={classId}
      sessionDate={sessionDate}
      titleLabel={titleLabel}
      contextLabel={contextLabel}
      registerLabel={registerLabel}
      enrolledCount={students.length}
      students={students}
      initialStatuses={initialStatuses}
      isLocked={isLocked}
      isBeforeSaveWindow={beforeSaveWindow}
    />
  );
}
