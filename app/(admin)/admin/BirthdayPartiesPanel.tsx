"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(portal)/(protected)/account/account.module.css";
import BirthdayPartyAvailabilityManager from "@/components/admin/BirthdayPartyAvailabilityManager";
import type { AdminBirthdayPartyBookingRow } from "@/lib/server/adminBirthdayPartyBookings";
import type { BirthdayPartyCalendarSlotSummary } from "@/lib/server/birthdayPartyBookings";

type BirthdayPartiesPanelProps = {
  bookingRows: AdminBirthdayPartyBookingRow[];
  calendarSlots: BirthdayPartyCalendarSlotSummary[];
  bookingsLoadError: string | null;
  availabilityLoadError: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

function formatBirthdayTimeRange(startTime: string, endTime: string) {
  const formatOne = (value: string) => {
    const [hourRaw, minuteRaw] = value.split(":");
    const hour = Number.parseInt(hourRaw ?? "", 10);
    const minute = Number.parseInt(minuteRaw ?? "", 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
    const date = new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
    return new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    })
      .format(date)
      .replace(":00", "")
      .replace(" ", "")
      .toLowerCase();
  };

  return `${formatOne(startTime)}-${formatOne(endTime)}`;
}

export default function BirthdayPartiesPanel({
  bookingRows,
  calendarSlots,
  bookingsLoadError,
  availabilityLoadError,
}: BirthdayPartiesPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [subview, setSubview] = useState<"bookings" | "availability">("bookings");

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return bookingRows.filter((row) => {
      if (!normalizedQuery) return true;

      return [
        row.accountFullName,
        row.email,
        row.accTelNo,
        row.birthdayChildFullName,
        row.slotDate,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [bookingRows, query]);

  const summary = useMemo(() => {
    const nextPartyDate = filteredRows[0]?.slotDate ?? null;
    return {
      upcomingCount: filteredRows.length,
      nextPartyDate,
    };
  }, [filteredRows]);

  return (
    <div className="space-y-4">
      <div className="inline-flex flex-wrap gap-2 rounded-xl border border-[#e6e0ee] bg-white p-1">
        <button
          type="button"
          onClick={() => setSubview("bookings")}
          className={[
            "rounded-lg px-3 py-2 text-sm font-semibold transition",
            subview === "bookings"
              ? "bg-[#6c35c3] text-white"
              : "text-[#5b2ca7] hover:bg-[#faf7ff]",
          ].join(" ")}
        >
          Upcoming parties
        </button>
        <button
          type="button"
          onClick={() => setSubview("availability")}
          className={[
            "rounded-lg px-3 py-2 text-sm font-semibold transition",
            subview === "availability"
              ? "bg-[#6c35c3] text-white"
              : "text-[#5b2ca7] hover:bg-[#faf7ff]",
          ].join(" ")}
        >
          Manage availability
        </button>
      </div>

      {bookingsLoadError ? (
        <div className={styles.errorBanner} role="alert">
          <span>{bookingsLoadError}</span>
        </div>
      ) : null}

      {!bookingsLoadError && subview === "bookings" ? (
        bookingRows.length > 0 ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[#e6e0ee] bg-white p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6c35c3]">
                  Upcoming parties
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#24193a]">
                  {summary.upcomingCount}
                </p>
              </div>
              <div className="rounded-xl border border-[#e6e0ee] bg-white p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6c35c3]">
                  Next party date
                </p>
                <p className="mt-2 text-lg font-black tracking-tight text-[#24193a]">
                  {formatDate(summary.nextPartyDate)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-[#e6e0ee] bg-white p-3">
              <div className="grid w-full grid-cols-1 gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search account, child, email or phone"
                  className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                />
              </div>

              <p className="text-sm text-[#2a203c]/80">
                Showing {filteredRows.length} of {bookingRows.length} upcoming birthday party bookings.
              </p>
            </div>

            <div className="space-y-3">
              {filteredRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => router.push(`/admin/birthday-parties/${encodeURIComponent(row.id)}`)}
                  className="group relative w-full overflow-hidden rounded-xl border border-[#e6e0ee] bg-white p-4 text-left transition hover:border-[#cbb6ea]"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-[#f0e8fb] transition-transform duration-300 ease-out group-hover:scale-x-100"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-2 left-0 z-[1] w-[2px] rounded-full bg-[#6e2ac0] opacity-0 transition-opacity duration-200 group-hover:opacity-75"
                  />
                  <div className="relative z-[1] grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_120px]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
                        Party date
                      </p>
                      <p className="mt-1 font-semibold text-[#24193a]">{formatDate(row.slotDate)}</p>
                      <p className="mt-0.5 text-sm text-[#5b526a]">
                        {formatBirthdayTimeRange(row.startTime, row.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
                        Birthday child
                      </p>
                      <p className="mt-1 font-semibold text-[#24193a]">{row.birthdayChildFullName}</p>
                      <p className="mt-0.5 text-sm text-[#5b526a]">
                        DOB: {formatDate(row.birthdayChildDateOfBirth)}
                      </p>
                      <p className="mt-1 text-sm text-[#5b526a]">
                        Turning{" "}
                        {typeof row.ageTurningAtParty === "number" ? row.ageTurningAtParty : "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
                        Account
                      </p>
                      <p className="mt-1 font-semibold text-[#24193a]">{row.accountFullName}</p>
                      <p className="mt-0.5 text-sm text-[#5b526a]">
                        {row.accTelNo || "No contact number"}
                      </p>
                      <p className="mt-0.5 text-sm text-[#5b526a] break-all">
                        {row.email || "No email address"}
                      </p>
                    </div>
                    <div className="lg:text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
                        Party size
                      </p>
                      <p className="mt-1 font-semibold text-[#24193a]">{row.partySize}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredRows.length === 0 ? (
              <p className="rounded-lg border border-[#e6e0ee] bg-white px-3 py-5 text-sm text-[#2a203c]/75">
                No birthday party bookings match your current filters.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[#2a203c]/75">
            There are no upcoming birthday party bookings right now.
          </p>
        )
      ) : null}

      {subview === "availability" && !availabilityLoadError ? (
        <BirthdayPartyAvailabilityManager initialSlots={calendarSlots} />
      ) : subview === "availability" ? (
        <div className={styles.errorBanner} role="alert">
          <span>{availabilityLoadError}</span>
        </div>
      ) : null}
    </div>
  );
}
