"use client";

import { useMemo, useState } from "react";
import styles from "@/app/(portal)/(protected)/account/account.module.css";
import type { AdminMissedPaymentRow } from "@/lib/server/adminMissedPayments";

type MissedPaymentsPanelProps = {
  rows: AdminMissedPaymentRow[];
  loadError: string | null;
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

function getStripeSubscriptionUrl(subscriptionId: string) {
  return `https://dashboard.stripe.com/subscriptions/${encodeURIComponent(subscriptionId)}`;
}

function getStripeCustomerUrl(customerId: string) {
  return `https://dashboard.stripe.com/customers/${encodeURIComponent(customerId)}`;
}

export default function MissedPaymentsPanel({
  rows,
  loadError,
}: MissedPaymentsPanelProps) {
  const [query, setQuery] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState<
    "all" | "Recreational" | "Competition"
  >("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "past_due" | "unpaid">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const statusOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.status)))
        .filter((status): status is "past_due" | "unpaid" => status === "past_due" || status === "unpaid")
        .sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextRows = rows.filter((row) => {
      if (programmeFilter !== "all" && row.programme !== programmeFilter) {
        return false;
      }
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }
      if (!normalizedQuery) return true;
      return [
        row.programme,
        row.accountFullName,
        row.email,
        row.status,
        row.subscriptionId,
        row.customerId,
        row.invoiceId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });

    nextRows.sort((a, b) => {
      const aTime = a.invoiceCreated ? Date.parse(a.invoiceCreated) : 0;
      const bTime = b.invoiceCreated ? Date.parse(b.invoiceCreated) : 0;
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return nextRows;
  }, [programmeFilter, query, rows, sort, statusFilter]);

  const summary = useMemo(() => {
    const affectedAccounts = new Set<string>();

    filteredRows.forEach((row) => {
      if (row.email) affectedAccounts.add(row.email.toLowerCase());
    });

    return {
      affectedAccountCount: affectedAccounts.size,
    };
  }, [filteredRows]);

  return (
    <div className="space-y-4">
      {loadError ? (
        <div className={styles.errorBanner} role="alert">
          <span>{loadError}</span>
        </div>
      ) : null}
      {!loadError ? (
        rows.length > 0 ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-[#e6e0ee] bg-white p-3 text-sm text-[#2a203c]/78">
              This view is pulled directly from both Stripe accounts and grouped at
              account/email level rather than child level.
            </div>

            <div className="grid gap-3 md:grid-cols-1 xl:grid-cols-4">
              <div className="rounded-xl border border-[#e6e0ee] bg-white p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6c35c3]">
                  Affected accounts
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#24193a]">
                  {summary.affectedAccountCount}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-[#e6e0ee] bg-white p-3">
              <div className="grid w-full grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_220px_180px_180px]">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search email, subscription, invoice or customer"
                  className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                />
                <select
                  value={programmeFilter}
                  onChange={(event) =>
                    setProgrammeFilter(
                      event.target.value as "all" | "Recreational" | "Competition"
                    )
                  }
                  className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                >
                  <option value="all">All programmes</option>
                  <option value="Recreational">Recreational</option>
                  <option value="Competition">Competition</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "all" | "past_due" | "unpaid")
                  }
                  className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                >
                  <option value="all">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as "newest" | "oldest")}
                  className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                >
                  <option value="newest">Newest invoice first</option>
                  <option value="oldest">Oldest invoice first</option>
                </select>
              </div>

              <p className="text-sm text-[#2a203c]/80">
                Showing {filteredRows.length} of {rows.length} late subscriptions.
              </p>
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-[#e6e0ee] md:block">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#f6f1ff]">
                  <tr className="text-left text-xs uppercase tracking-[0.08em] text-[#2a203c]/75">
                    <th className="px-3 py-2 font-semibold">Programme</th>
                    <th className="px-3 py-2 font-semibold">Account</th>
                    <th className="px-3 py-2 font-semibold">Payment status</th>
                    <th className="px-3 py-2 font-semibold">Subscription</th>
                    <th className="px-3 py-2 font-semibold">Latest invoice</th>
                    <th className="px-3 py-2 font-semibold">Next attempt</th>
                    <th className="px-3 py-2 font-semibold">Stripe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece6f4] bg-white text-sm text-[#2a203c]">
                  {filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-3 font-semibold">{row.programme}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#24193a]">{row.accountFullName}</p>
                        <p className="mt-0.5 text-[#5b526a]">
                          {row.accTelNo || "No contact number"}
                        </p>
                        <p className="mt-0.5 text-[#5b526a]">{row.email}</p>
                      </td>
                      <td className="px-3 py-3 uppercase">{row.status.replaceAll("_", " ")}</td>
                      <td className="px-3 py-3 uppercase">
                        {row.subscriptionState.replaceAll("_", " ")}
                      </td>
                      <td className="px-3 py-3">{formatDate(row.invoiceCreated)}</td>
                      <td className="px-3 py-3">{formatDate(row.nextPaymentAttempt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <a
                            href={getStripeSubscriptionUrl(row.subscriptionId)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-9 items-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-xs font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                          >
                            View subscription
                          </a>
                          <a
                            href={getStripeCustomerUrl(row.customerId)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-9 items-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-xs font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                          >
                            View customer
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 md:hidden">
              {filteredRows.map((row) => (
                <div key={row.id} className="rounded-xl border border-[#e6e0ee] bg-white p-3">
                  <div className="space-y-1.5 text-sm text-[#2a203c]">
                    <p className="font-semibold">{row.programme}</p>
                    <p className="font-semibold text-[#24193a]">{row.accountFullName}</p>
                    <p>{row.accTelNo || "No contact number"}</p>
                    <p>{row.email}</p>
                    <p className="uppercase">Payment: {row.status.replaceAll("_", " ")}</p>
                    <p className="uppercase">
                      Subscription: {row.subscriptionState.replaceAll("_", " ")}
                    </p>
                    <p>Invoice: {formatDate(row.invoiceCreated)}</p>
                    <p>Next attempt: {formatDate(row.nextPaymentAttempt)}</p>
                    <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                      <a
                        href={getStripeSubscriptionUrl(row.subscriptionId)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-sm font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                      >
                        View subscription
                      </a>
                      <a
                        href={getStripeCustomerUrl(row.customerId)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-sm font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                      >
                        View customer
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRows.length === 0 ? (
              <p className="rounded-lg border border-[#e6e0ee] bg-white px-3 py-5 text-sm text-[#2a203c]/75">
                No missed payments match your current filters.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[#2a203c]/75">
            No late or missed subscription payments found in the configured Stripe accounts.
          </p>
        )
      ) : null}
    </div>
  );
}
