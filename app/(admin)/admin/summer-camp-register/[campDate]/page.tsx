import { notFound } from "next/navigation";
import RegisterSheetClient from "../../register/[classId]/RegisterSheetClient";
import { supabaseAdmin } from "@/lib/admin";
import { getMedicalInfoForChildren } from "@/lib/server/medical";
import { isBeforeSaveWindow, isRegisterLocked, shouldBypassSaveWindow } from "@/lib/server/registerLock";
import { getSummerCampRegisterStudents } from "@/lib/server/summerCampBookings";

type SummerCampRegisterDetailPageProps = {
  params: Promise<{ campDate: string }>;
  searchParams?: Promise<{ slug?: string | string[] }>;
};

type SummerCampSessionRow = {
  id: string;
  title: string | null;
  campDate: string;
  startTime: string | null;
  endTime: string | null;
  capacity: number | null;
};

type RegisterHeaderRow = {
  id: string;
};

type RegisterEntryRow = {
  childId: string;
  isPresent: boolean;
  isCollected: boolean | null;
};

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

function formatTitleDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatRegisterDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
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

function hasMeaningfulMedicalValue(value: string | null | undefined): boolean {
  const normalized = (value ?? "").trim();
  if (!normalized) return false;
  return normalized.toLowerCase() !== "not provided";
}

export default async function SummerCampRegisterDetailPage({
  params,
  searchParams,
}: SummerCampRegisterDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const campDate = resolvedParams.campDate;
  const slugParam = Array.isArray(resolvedSearchParams.slug)
    ? resolvedSearchParams.slug[0]
    : resolvedSearchParams.slug;
  const slug = slugParam?.trim() || "summer-camps-2026";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(campDate)) {
    notFound();
  }

  const { data: sessionRow, error: sessionError } = await supabaseAdmin
    .from("SummerCampSessions")
    .select('id,title,campDate:"campDate",startTime:"startTime",endTime:"endTime",capacity')
    .eq("slug", slug)
    .eq("campDate", campDate)
    .maybeSingle();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const session = (sessionRow ?? null) as SummerCampSessionRow | null;
  if (!session) {
    notFound();
  }

  const registerStudents = await getSummerCampRegisterStudents({ slug, campDate });
  const childIds = registerStudents.map((student) => student.childId);
  const medicalByChildId =
    childIds.length > 0 ? await getMedicalInfoForChildren(childIds) : {};

  const students = registerStudents
    .map((student) => {
      const medical = medicalByChildId[student.childId];
      const firstName = student.firstName?.trim() || "";
      const lastName = student.lastName?.trim() || "";
      const hasMedicalAlert =
        hasMeaningfulMedicalValue(medical?.medicalConditions) ||
        hasMeaningfulMedicalValue(medical?.medications) ||
        hasMeaningfulMedicalValue(medical?.disabilities) ||
        hasMeaningfulMedicalValue(medical?.behaviouralConditions) ||
        hasMeaningfulMedicalValue(medical?.allergies) ||
        hasMeaningfulMedicalValue(medical?.dietaryNeeds);

      return {
        id: student.childId,
        fullName: `${firstName} ${lastName}`.trim() || "Unknown student",
        requiresPickup: toRequiresPickup(student.pickedUp),
        hasMedicalAlert,
        photographyAllowed: student.photoConsent === true,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "en-GB"));

  const isLocked = isRegisterLocked({
    sessionDate: campDate,
    startTime: session.startTime,
    endTime: session.endTime,
    durationMinutes: null,
    lockHours: 12,
  });
  const beforeSaveWindow = shouldBypassSaveWindow()
    ? false
    : isBeforeSaveWindow({
        sessionDate: campDate,
        startTime: session.startTime,
        endTime: session.endTime,
        leadMinutes: 15,
      });

  const { data: registerHeader, error: registerHeaderError } = await supabaseAdmin
    .from("SummerCampRegisters")
    .select("id")
    .eq("slug", slug)
    .eq("campDate", campDate)
    .maybeSingle();

  if (registerHeaderError) {
    throw new Error(registerHeaderError.message);
  }

  const registerId = ((registerHeader ?? null) as RegisterHeaderRow | null)?.id ?? null;
  const initialStatuses: Record<string, "present" | "absent"> = {};
  const initialCollected: Record<string, boolean> = {};

  if (registerId) {
    const { data: entryRows, error: entryError } = await supabaseAdmin
      .from("SummerCampRegisterEntries")
      .select('childId:"childId",isPresent:"isPresent",isCollected:"isCollected"')
      .eq("registerId", registerId);

    if (entryError) {
      throw new Error(entryError.message);
    }

    ((entryRows ?? []) as RegisterEntryRow[]).forEach((row) => {
      initialStatuses[row.childId] = row.isPresent ? "present" : "absent";
      if (row.isCollected === true) {
        initialCollected[row.childId] = true;
      }
    });
  }

  return (
    <RegisterSheetClient
      classId={slug}
      sessionDate={campDate}
      titleLabel={session.title?.trim() || "Summer Camp 2026"}
      contextLabel={`${formatTitleDate(campDate)} • ${formatTime(session.startTime)}-${formatTime(session.endTime)}`}
      registerLabel={`Register for ${formatRegisterDate(campDate)}`}
      enrolledCount={students.length}
      students={students}
      initialStatuses={initialStatuses}
      initialCollected={initialCollected}
      isLocked={isLocked}
      isBeforeSaveWindow={beforeSaveWindow}
      sectionLabel="Summer camp register"
      backHref="/admin?tab=summer-camp-register"
      backLabel="Back to summer camp register"
      saveEndpoint="/api/admin/summer-camp-register/save"
      savePayload={{
        slug,
        campDate,
      }}
    />
  );
}
