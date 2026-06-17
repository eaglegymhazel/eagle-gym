"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styles from "@/app/(portal)/(protected)/account/account.module.css";
import type { AdminWaitlistRow } from "@/lib/server/adminDashboard";

type WaitingRow = {
  childId: string;
  classId: string;
  childName: string;
  className: string;
  accountEmail: string;
  accountTelNo: string;
  requestedOn: string;
};

type WaitlistPanelProps = {
  initialRows: AdminWaitlistRow[];
  loadError: string | null;
};

function formatWaitlistDate(value: string) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function WaitlistPanel({ initialRows, loadError }: WaitlistPanelProps) {
  const [rows, setRows] = useState<WaitingRow[]>(initialRows);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sort, setSort] = useState<"oldest" | "newest">("oldest");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<WaitingRow | null>(null);

  const classOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.className)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextRows = rows.filter((row) => {
      if (classFilter !== "all" && row.className !== classFilter) return false;
      if (!normalizedQuery) return true;
      return [
        row.childName,
        row.className,
        row.accountEmail,
        row.accountTelNo,
        row.requestedOn,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });

    nextRows.sort((a, b) => {
      const aTime = Date.parse(a.requestedOn || "");
      const bTime = Date.parse(b.requestedOn || "");
      const aSafe = Number.isNaN(aTime) ? Number.MAX_SAFE_INTEGER : aTime;
      const bSafe = Number.isNaN(bTime) ? Number.MAX_SAFE_INTEGER : bTime;
      return sort === "oldest" ? aSafe - bSafe : bSafe - aSafe;
    });

    return nextRows;
  }, [classFilter, query, rows, sort]);

  const removeFromWaitlist = async (row: WaitingRow) => {
    const rowKey = `${row.childId}-${row.classId}`;
    setRemovingKey(rowKey);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await fetch("/api/admin/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: row.childId, classId: row.classId }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not remove waitlist entry.");
      }

      setRows((prev) =>
        prev.filter((entry) => !(entry.childId === row.childId && entry.classId === row.classId))
      );
      setActionMessage(`${row.childName} removed from waitlist.`);
      setDeleteCandidate(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not remove waitlist entry."
      );
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {loadError ? (
          <div className={styles.errorBanner} role="alert">
            <span>{loadError}</span>
          </div>
        ) : null}
        {actionError ? (
          <div className={styles.errorBanner} role="alert">
            <span>{actionError}</span>
          </div>
        ) : null}
        {actionMessage ? (
          <div className="rounded-lg border border-[#d7c7ef] bg-[#f6f1ff] px-3 py-2 text-sm text-[#2a203c]">
            {actionMessage}
          </div>
        ) : null}
        {!loadError ? (
          rows.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 rounded-xl border border-[#e6e0ee] bg-white p-3 md:flex-row md:items-center md:justify-between">
                <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_220px_220px]">
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search child, class, email or phone"
                    className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                  />
                  <select
                    value={classFilter}
                    onChange={(event) => setClassFilter(event.target.value)}
                    className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                  >
                    <option value="all">All classes</option>
                    {classOptions.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value === "newest" ? "newest" : "oldest")
                    }
                    className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                  >
                    <option value="oldest">Oldest first</option>
                    <option value="newest">Newest first</option>
                  </select>
                </div>
              </div>

              <p className="text-sm text-[#2a203c]/80">
                Showing {filteredRows.length} of {rows.length} entries.
              </p>

              <div className="hidden overflow-hidden rounded-xl border border-[#e6e0ee] md:block">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[#f6f1ff]">
                    <tr className="text-left text-xs uppercase tracking-[0.08em] text-[#2a203c]/75">
                      <th className="px-3 py-2 font-semibold">Student</th>
                      <th className="px-3 py-2 font-semibold">Class</th>
                      <th className="px-3 py-2 font-semibold">Date added</th>
                      <th className="px-3 py-2 font-semibold">Email</th>
                      <th className="px-3 py-2 font-semibold">Phone</th>
                      <th className="px-3 py-2 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ece6f4] bg-white text-sm text-[#2a203c]">
                    {filteredRows.map((row) => {
                      const rowKey = `${row.childId}-${row.classId}`;
                      const isRemoving = removingKey === rowKey;
                      return (
                        <tr key={`${rowKey}-${row.requestedOn}`}>
                          <td className="px-3 py-3 font-semibold">{row.childName}</td>
                          <td className="px-3 py-3">{row.className}</td>
                          <td className="px-3 py-3">{formatWaitlistDate(row.requestedOn)}</td>
                          <td className="px-3 py-3">
                            {row.accountEmail || <span className="text-[#2a203c]/55">Not set</span>}
                          </td>
                          <td className="px-3 py-3">
                            {row.accountTelNo || <span className="text-[#2a203c]/55">Not set</span>}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setDeleteCandidate(row);
                              }}
                              disabled={isRemoving}
                              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-[#dfcfe9] bg-white px-3 text-xs font-semibold text-[#6a1f35] transition hover:bg-[#fff4f7] disabled:cursor-not-allowed disabled:opacity-55"
                            >
                              {isRemoving ? "Removing..." : "Remove"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 md:hidden">
                {filteredRows.map((row) => {
                  const rowKey = `${row.childId}-${row.classId}`;
                  const isRemoving = removingKey === rowKey;
                  return (
                    <div key={`${rowKey}-${row.requestedOn}`} className="rounded-xl border border-[#e6e0ee] bg-white p-3">
                      <div className="space-y-1.5 text-sm text-[#2a203c]">
                        <p className="font-semibold">{row.childName}</p>
                        <p>{row.className}</p>
                        <p>{formatWaitlistDate(row.requestedOn)}</p>
                        <p>{row.accountEmail || "Email not set"}</p>
                        <p>{row.accountTelNo || "Phone not set"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          setDeleteCandidate(row);
                        }}
                        disabled={isRemoving}
                        className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-[#dfcfe9] bg-white px-3 text-xs font-semibold text-[#6a1f35] transition hover:bg-[#fff4f7] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {isRemoving ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {filteredRows.length === 0 ? (
                <p className="rounded-lg border border-[#e6e0ee] bg-white px-3 py-5 text-sm text-[#2a203c]/75">
                  No waitlist entries match your current filters.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-[#2a203c]/75">No children are currently on the waiting list.</p>
          )
        ) : null}
      </div>

      <Dialog.Root
        open={deleteCandidate !== null}
        onOpenChange={(open) => {
          if (!open && !removingKey) {
            setDeleteCandidate(null);
            setActionError(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
          <Dialog.Content className="fixed inset-x-3 top-1/2 z-[101] max-h-[86vh] -translate-y-1/2 overflow-hidden border border-[#d8ceeb] bg-white shadow-2xl sm:left-1/2 sm:right-auto sm:w-[min(520px,calc(100vw-32px))] sm:-translate-x-1/2">
            <div className="border-b border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div>
                <Dialog.Title className="text-lg font-bold text-[#24193a]">
                  Remove waitlist entry
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-[#5f5177]">
                  This will remove the student from the waiting list for this class.
                </Dialog.Description>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5">
              <p className="text-sm text-[#342744]">
                Remove{" "}
                <span className="font-semibold text-[#24193a]">
                  {deleteCandidate?.childName ?? "this student"}
                </span>{" "}
                from{" "}
                <span className="font-semibold text-[#24193a]">
                  {deleteCandidate?.className ?? "this class"}
                </span>
                ?
              </p>
              <p className="mt-2 text-sm text-[#6c607d]">
                Warning, this action is permanent and cannot be undone.
              </p>
            </div>

            <div className="border-t border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={removingKey !== null}
                    className="h-10 border border-[#ddd4ea] bg-white px-4 text-sm font-semibold text-[#6f6384] hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={() => {
                    if (!deleteCandidate) return;
                    void removeFromWaitlist(deleteCandidate);
                  }}
                  disabled={!deleteCandidate || removingKey !== null}
                  className={[
                    "h-10 border px-4 text-sm font-semibold transition",
                    deleteCandidate && removingKey === null
                      ? "cursor-pointer border-[#d93636] bg-[#d93636] text-white hover:bg-[#bd2d2d]"
                      : "cursor-not-allowed border-[#eadada] bg-[#f8f6fb] text-[#b79a9a]",
                  ].join(" ")}
                >
                  {removingKey !== null ? "Removing..." : "Remove entry"}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
