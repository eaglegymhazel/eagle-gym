"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

type Preview = {
  subscriptionId: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  cancelAtPeriodEnd: boolean;
  description: string | null;
  items: Array<{ name: string; amount: number | null; currency: string; quantity: number; interval?: string; intervalCount?: number }>;
  linkedBookings: string[];
};

type SubscriptionOption = Omit<Preview, "subscriptionId" | "customerId"> & { id: string; studentName?: string };

function formatItem(item: Preview["items"][number]) {
  const price = item.amount == null ? "Variable price" : new Intl.NumberFormat("en-GB", { style: "currency", currency: item.currency }).format(item.amount / 100);
  return `${item.name}: ${price}${item.interval ? ` every ${item.intervalCount ?? 1} ${item.interval}` : ""} x ${item.quantity}`;
}

export default function LinkStripeSubscriptionControl({ bookingId, linkedSubscriptionId, bookingLabel }: {
  bookingId: string;
  linkedSubscriptionId: string | null;
  bookingLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SubscriptionOption[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [showLinked, setShowLinked] = useState(false);
  const [hiddenLinkedCount, setHiddenLinkedCount] = useState(0);
  const loadSubscriptions = async (includeLinked = false) => {
    setLoadingList(true); setListError(null); setOptions([]); setHiddenLinkedCount(0);
    try {
      const response = await fetch("/api/admin/link-stripe-subscription", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "list", includeLinked }),
      });
      const result = await response.json() as { error?: string; subscriptions?: SubscriptionOption[]; hiddenLinkedCount?: number };
      if (!response.ok) throw new Error(result.error ?? "Unable to load subscriptions.");
      setOptions(result.subscriptions ?? []);
      setHiddenLinkedCount(result.hiddenLinkedCount ?? 0);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Unable to load subscriptions.");
      setManual(true);
    } finally { setLoadingList(false); }
  };
  const [subscriptionId, setSubscriptionId] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const submit = async (confirm: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/link-stripe-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, subscriptionId: subscriptionId.trim(), confirm }),
      });
      const result = await response.json() as { error?: string; preview?: Preview };
      if (!response.ok) throw new Error(result.error ?? "Unable to link subscription.");
      if (confirm) window.location.reload();
      else {
        setPreview(result.preview ?? null);
        setConfirmed(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to link subscription.");
    } finally {
      setBusy(false);
    }
  };
  if (linkedSubscriptionId) return (
    <a
      href={`https://dashboard.stripe.com/subscriptions/${encodeURIComponent(linkedSubscriptionId)}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-8 items-center justify-center border border-[#d9ccef] px-2.5 text-xs font-semibold text-[#5b2ca7] hover:bg-[#f4eeff]"
    >
      View Stripe subscription
    </a>
  );
  return (
    <Dialog.Root open={open} onOpenChange={value => {
      if (busy || loadingList) return;
      setOpen(value);
      setManual(false);
      setShowLinked(false);
      if (value) void loadSubscriptions();
      setSubscriptionId(""); setPreview(null); setConfirmed(false); setError(null);
    }}>
      <Dialog.Trigger asChild>
        <button type="button" className="h-8 cursor-pointer border border-[#99d5ce] bg-[#dff3ef] px-2.5 text-xs font-semibold text-[#115e59] transition hover:border-[#65b8ad] hover:bg-[#c6e9e2]">Link Stripe subscription</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-[#221833]">Link Stripe subscription</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-[#5f5177]">
            Link the subscription covering {bookingLabel}. Choose a subscription below, or paste its ID from Stripe. Linking does not change charges or payment dates.
          </Dialog.Description>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showLinked} disabled={busy || loadingList} onChange={event => {
                const value = event.target.checked;
                setShowLinked(value); setSubscriptionId(""); setPreview(null); setConfirmed(false); setError(null);
                void loadSubscriptions(value);
              }} />
              Show already linked subscriptions
            </label>
            {!loadingList && hiddenLinkedCount > 0 && <p className="text-sm text-[#5f5177]">
              {hiddenLinkedCount} already linked subscription{hiddenLinkedCount === 1 ? " is" : "s are"} hidden.
            </p>}
            {loadingList ? <p role="status" className="text-sm">Loading the parent&apos;s Stripe subscriptions...</p> : <>
              {listError ? <p role="alert" className="text-sm text-red-700">{listError} You can paste an ID below.</p> : options.length === 0 ? <p className="text-sm">{showLinked ? "No eligible subscriptions found for this parent. You can paste an ID below." : "No matching unlinked subscriptions found. Use the toggle to include linked subscriptions, or paste an ID below."}</p> : null}
              {!manual && options.length > 0 && <fieldset className="space-y-2" disabled={busy}>
                <legend className="mb-2 text-sm font-medium">Select the subscription covering this child and class</legend>
                {options.map(option => <label key={option.id} className="flex cursor-pointer items-start gap-2 rounded border border-[#d9ccef] p-3 text-sm">
                  <input type="radio" name={`subscription-${bookingId}`} checked={subscriptionId === option.id} onChange={() => { setSubscriptionId(option.id); setPreview(null); setConfirmed(false); setError(null); }} />
                  <span className="min-w-0 break-words"><span className="block font-medium">{option.studentName || option.description || option.customerName || "Subscription"}</span>
                    <span className="block">{option.customerEmail} - {option.status}{option.cancelAtPeriodEnd ? " (scheduled to cancel)" : ""}</span>
                    {option.items.map((item, index) => <span key={index} className="block">{formatItem(item)}</span>)}
                    {option.linkedBookings.length > 0 && <span className="mt-1 block font-medium text-[#5b2ca7]">
                      Already linked to: {option.linkedBookings.join("; ")}
                    </span>}
                    <span className="block text-xs text-[#5f5177]">{option.id}</span>
                  </span>
                </label>)}
              </fieldset>}
            </>}
            <button type="button" disabled={busy || loadingList} className="text-sm text-[#5b2ca7] underline" onClick={() => { setManual(!manual); setSubscriptionId(""); setPreview(null); setConfirmed(false); setError(null); }}>
              {manual ? "Choose from the subscription list" : "Enter or paste a subscription ID instead"}
            </button>
          </div>
          <form className="mt-4 space-y-4" onSubmit={event => { event.preventDefault(); if (!busy) void submit(false); }}>
            {(manual || (!loadingList && options.length === 0)) && <label className="block text-sm font-medium">
              Stripe subscription ID
              <input autoComplete="off" placeholder="sub_..." value={subscriptionId} disabled={busy} onChange={event => {
                setSubscriptionId(event.target.value); setPreview(null); setConfirmed(false); setError(null);
              }} className="mt-1 block w-full rounded border border-[#d9ccef] p-2" />
            </label>}
            <button type="submit" disabled={busy || !subscriptionId.trim()} className="cursor-pointer rounded border border-[#5b2ca7] bg-[#5b2ca7] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#49228c] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Checking�" : "Review selection"}</button>
          </form>
          {preview && <div className="mt-4 space-y-2 rounded border border-[#d9ccef] p-3 text-sm">
            <p><strong>Customer:</strong> {preview.customerName || "Name not set"} � {preview.customerEmail || "Email not set"}</p>
            <p><strong>Status:</strong> {preview.status}{preview.cancelAtPeriodEnd ? " (scheduled to cancel at period end)" : ""}</p>
            {preview.description && <p>{preview.description}</p>}
            <ul className="list-inside list-disc">{preview.items.map((item, index) => <li key={index}>
              {item.name}: {item.amount == null ? "Variable price" : new Intl.NumberFormat("en-GB", { style: "currency", currency: item.currency }).format(item.amount / 100)}
              {item.interval ? ` every ${item.intervalCount ?? 1} ${item.interval}` : ""} � {item.quantity}
            </li>)}</ul>
            <p className="text-xs text-[#5f5177]">Prices shown before any discounts or tax.</p>
            {preview.linkedBookings.length > 0 && <div><strong>Already linked to:</strong><ul className="list-inside list-disc">{preview.linkedBookings.map((label, index) => <li key={index}>{label}</li>)}</ul></div>}
            <p>When this subscription is cancelled in Stripe, all bookings linked to it will be cancelled in the portal.</p>
            <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} />
              I have checked this subscription covers this child and class, including any bookings already linked.
            </label>
            <button type="button" disabled={busy || !confirmed} onClick={() => void submit(true)} className="cursor-pointer rounded border border-[#15803d] bg-[#15803d] px-3 py-2 font-semibold text-white transition hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving�" : "Confirm link"}</button>
          </div>}
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          <Dialog.Close disabled={busy || loadingList} className="mt-4 cursor-pointer rounded border border-[#d93636] bg-[#d93636] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#bd2d2d] disabled:cursor-not-allowed disabled:opacity-50">Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
