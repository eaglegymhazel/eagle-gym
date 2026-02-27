import Link from "next/link";
import { supabaseAdmin } from "@/lib/admin";
import { getMedicalInfoForChildren } from "@/lib/server/medical";
import { getActiveBookingsForChildren } from "@/lib/server/bookings";
import { Activity, ArrowLeft, CalendarDays, Shield, Star, UserCircle2, Users } from "lucide-react";
import StudentProfileTabs from "./StudentProfileTabs";

type StudentProfilePageProps = {
  params: Promise<{ childId: string }>;
};

type ChildRow = {
  id: string;
  accountId: string | number | null;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  photoConsent: boolean | null;
  competitionEligible: boolean | null;
  pickedUp: string | null;
};

type AccountRow = {
  id: string | number;
  accFirstName: string | null;
  accLastName: string | null;
  accTelNo: string | null;
  accEmergencyTelNo: string | null;
};

function formatDate(date: string | null): string {
  if (!date) return "Not set";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function computeAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "Unknown";
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return "Unknown";
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  if (!birthdayPassed) age -= 1;
  return `${Math.max(0, age)} years`;
}

function formatAttendingDuration(createdAt: string | null | undefined): string {
  if (!createdAt) return "Attending since unknown date";
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return "Attending since unknown date";

  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) return "Attending recently";

  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / dayMs);
  if (days < 7) {
    const safeDays = Math.max(1, days);
    return `Attending for ${safeDays} day${safeDays === 1 ? "" : "s"}`;
  }

  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 1) {
    const weeks = Math.max(1, Math.floor(days / 7));
    return `Attending for ${weeks} week${weeks === 1 ? "" : "s"}`;
  }

  if (months < 12) {
    return `Attending for ${months} month${months === 1 ? "" : "s"}`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return `Attending for ${years} year${years === 1 ? "" : "s"}`;
  }
  return `Attending for ${years}y ${remainingMonths}m`;
}

function getProgrammeTag(className: string | null | undefined): "Rec" | "Comp" {
  const text = (className ?? "").toLowerCase();
  return text.includes("comp") ? "Comp" : "Rec";
}

function extractAgeBand(className: string | null | undefined): string | null {
  const match = (className ?? "").match(/\(([^)]+)\)/);
  const value = match?.[1]?.trim() || null;
  if (!value) return null;
  if (value.toLowerCase() === "comp") return null;
  return value;
}

function displayText(value: string | null | undefined): string {
  return value?.trim() ? value : "Not provided";
}

function normalizeMedicalValue(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;
  if (normalized.toLowerCase() === "not provided") return null;
  return normalized;
}

function pickupSummary(pickedUp: string | null | undefined): string {
  return (pickedUp ?? "").trim().toLowerCase() === "yes"
    ? "May leave unaccompanied"
    : "Must be collected";
}

function photoConsentSummary(photoConsent: boolean | null | undefined): string {
  return photoConsent === true
    ? "Permitted for coaching/training"
    : "Not permitted for coaching/training";
}

function competitionSummary(competitionEligible: boolean | null | undefined): string {
  return competitionEligible === true ? "Eligible" : "Not eligible";
}

export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  const resolvedParams = await params;
  const childId = resolvedParams.childId;

  const { data: childData, error: childError } = await supabaseAdmin
    .from("Children")
    .select(
      "id,accountId,firstName,lastName,dateOfBirth,photoConsent,competitionEligible,pickedUp"
    )
    .eq("id", childId)
    .maybeSingle();

  if (childError || !childData) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <section className="border border-[#ddd3ea] bg-white p-5 md:p-6">
          <h1 className="text-2xl font-bold text-[#221833]">Student not found</h1>
          <p className="mt-2 text-sm text-[#5d4f75]">
            The selected student could not be loaded.
          </p>
          <Link
            href="/admin?tab=students"
            className="mt-5 inline-flex items-center border border-[#d9cfee] px-3 py-2 text-sm font-semibold text-[#5a279f] hover:bg-[#f4effd]"
          >
            Back to Student Management
          </Link>
        </section>
      </main>
    );
  }

  const child = childData as ChildRow;
  const [medicalByChildId, bookingsByChildId, accountResult] = await Promise.all([
    getMedicalInfoForChildren([child.id]),
    getActiveBookingsForChildren([child.id]),
    child.accountId != null
      ? supabaseAdmin
          .from("Accounts")
          .select("id,accFirstName,accLastName,accTelNo,accEmergencyTelNo")
          .eq("id", child.accountId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const medical = medicalByChildId[child.id] ?? null;
  const bookings = bookingsByChildId[child.id] ?? [];
  const account = (accountResult.data as AccountRow | null) ?? null;
  const studentName = `${displayText(child.firstName)} ${displayText(child.lastName)}`.trim();
  const isCompetitionStudent =
    child.competitionEligible === true ||
    bookings.some((booking) => getProgrammeTag(booking.className) === "Comp");

  const healthRows = [
    { label: "Medical conditions", value: normalizeMedicalValue(medical?.medicalConditions) },
    { label: "Medications", value: normalizeMedicalValue(medical?.medications) },
    { label: "Disabilities", value: normalizeMedicalValue(medical?.disabilities) },
    {
      label: "Behavioural conditions",
      value: normalizeMedicalValue(medical?.behaviouralConditions),
    },
    { label: "Allergies", value: normalizeMedicalValue(medical?.allergies) },
    { label: "Dietary needs", value: normalizeMedicalValue(medical?.dietaryNeeds) },
  ].filter((row) => row.value);

  const doctorRows = [
    { label: "Doctor name", value: normalizeMedicalValue(medical?.doctorName) },
    { label: "Surgery address", value: normalizeMedicalValue(medical?.surgeryAddress) },
    { label: "Surgery telephone", value: normalizeMedicalValue(medical?.surgeryTelephone) },
  ].filter((row) => row.value);

  const hasMedicalData = healthRows.length > 0 || doctorRows.length > 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <StudentProfileTabs isCompetitionStudent={isCompetitionStudent}>
        <section className="border border-[#ddd3ea] bg-white">
          <header className="flex flex-col gap-4 border-b border-[#e8e0f2] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6f6287]">
                Student profile
              </p>
              <h1 className="mt-2 text-2xl font-bold text-[#221833]">{studentName}</h1>
              <p className="mt-1 text-sm text-[#5f5177]">
                {formatDate(child.dateOfBirth)} | {computeAge(child.dateOfBirth)}
              </p>
            </div>
            <Link
              href="/admin?tab=students"
              className="inline-flex w-full items-center justify-center gap-1.5 border border-[#c7b4e5] bg-[#f7f2ff] px-3.5 py-2 text-sm font-semibold text-[#4f2390] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition hover:border-[#b398dd] hover:bg-[#f1e8ff] active:bg-[#ebddff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35 md:w-auto"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Student Management
            </Link>
          </header>

        <div className="grid gap-0 lg:grid-cols-2">
          <section className="border-b border-[#e8e0f2] px-5 py-5 md:px-6 lg:border-b-0 lg:border-r">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
              <UserCircle2 className="h-4 w-4 text-[#6e2ac0]" aria-hidden="true" />
              Student details
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  First name
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {displayText(child.firstName)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Last name
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {displayText(child.lastName)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Date of birth
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {formatDate(child.dateOfBirth)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Age
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {computeAge(child.dateOfBirth)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Photo consent
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {photoConsentSummary(child.photoConsent)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Competition classes
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {competitionSummary(child.competitionEligible)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  End of class
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {pickupSummary(child.pickedUp)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="border-b border-[#e8e0f2] px-5 py-5 md:px-6 lg:border-b-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
              <Users className="h-4 w-4 text-[#6e2ac0]" aria-hidden="true" />
              Account details
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Account first name
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {displayText(account?.accFirstName)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Account last name
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {displayText(account?.accLastName)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Contact number
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {displayText(account?.accTelNo)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Emergency contact
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {displayText(account?.accEmergencyTelNo)}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="border-b border-[#e8e0f2] px-5 py-5 md:px-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
            <CalendarDays className="h-4 w-4 text-[#6e2ac0]" aria-hidden="true" />
            Active bookings
          </h2>
          {bookings.length === 0 ? (
            <p className="mt-3 text-sm text-[#5f5177]">No active bookings found.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#ece4f5] border border-[#ece4f5]">
              {bookings.map((booking, index) => (
                <li
                  key={`${booking.childId}-${booking.className ?? "class"}-${index}`}
                  className="flex flex-col gap-1.5 px-4 py-2 md:flex-row md:items-center md:justify-between md:gap-3"
                >
                  {(() => {
                    const programme = getProgrammeTag(booking.className);
                    const ageBand = extractAgeBand(booking.className);
                    const weekdayText = displayText(booking.weekday);
                    const timeText = `${booking.startTime ?? "--:--"}${
                      booking.endTime ? `-${booking.endTime}` : ""
                    }`;

                    return (
                      <p className="min-w-0 truncate text-[#221833] md:flex md:flex-wrap md:items-baseline md:gap-x-2">
                        <span
                          className={[
                            "inline-flex items-center gap-1 text-sm font-semibold leading-none",
                            programme === "Comp" ? "text-[#c89200]" : "text-[#0f8d4e]",
                          ].join(" ")}
                        >
                          <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                          {programme}
                        </span>
                        <span className="text-sm font-semibold leading-none">{weekdayText}</span>
                        <span className="text-sm font-medium leading-none text-[#322843]">{timeText}</span>
                        {programme === "Rec" && ageBand ? (
                          <span className="text-xs font-normal leading-none text-[#6e6383]">{ageBand}</span>
                        ) : null}
                      </p>
                    );
                  })()}

                  <span className="text-xs font-medium leading-tight text-[#6e6383] md:flex-shrink-0">
                    {formatAttendingDuration(booking.createdAt).replace("Attending for ", "Attending ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="px-5 py-5 md:px-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
            <Activity className="h-4 w-4 text-[#6e2ac0]" aria-hidden="true" />
            Medical information
          </h2>
          {!hasMedicalData ? (
            <p className="mt-3 text-sm text-[#5f5177]">
              No medical information has been provided.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              {healthRows.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#7a6e90]">
                    Health details
                  </h3>
                  <dl className="grid gap-2.5 sm:grid-cols-2">
                    {healthRows.map((row) => (
                      <div
                        key={row.label}
                        className="border border-[#ece4f5] bg-[#fcfafe] px-4 py-2.5"
                      >
                        <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                          <Shield className="h-3.5 w-3.5 text-[#6f6287]" aria-hidden="true" />
                          {row.label}
                        </dt>
                        <dd className="mt-1 text-sm text-[#221833]">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              {doctorRows.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#7a6e90]">
                    GP / Surgery details
                  </h3>
                  <dl className="grid gap-2.5 sm:grid-cols-2">
                    {doctorRows.map((row) => (
                      <div
                        key={row.label}
                        className="border border-[#ece4f5] bg-[#fcfafe] px-4 py-2.5"
                      >
                        <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                          <Shield className="h-3.5 w-3.5 text-[#6f6287]" aria-hidden="true" />
                          {row.label}
                        </dt>
                        <dd className="mt-1 text-sm text-[#221833]">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          )}
        </section>
        </section>
      </StudentProfileTabs>
    </main>
  );
}

