"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";

type DeleteBirthdayPartyBookingButtonProps = {
  bookingId: string;
  childName: string;
  slotDateLabel: string;
  className?: string;
};

export default function DeleteBirthdayPartyBookingButton({
  bookingId,
  childName,
  slotDateLabel,
  className,
}: DeleteBirthdayPartyBookingButtonProps) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefundAcknowledged, setIsRefundAcknowledged] = useState(false);

  const handleDelete = async () => {
    setIsRemoving(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/admin/birthday-party-bookings/${encodeURIComponent(bookingId)}`,
        { method: "DELETE" }
      );
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Could not remove birthday party booking.");
      }

      setIsConfirmOpen(false);
      router.push("/admin?tab=birthday-parties");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not remove birthday party booking."
      );
      setIsRemoving(false);
    }
  };

  return (
    <div className="mt-5">
      {errorMessage ? (
        <div className="mb-3 rounded-lg border border-[#f0c7cf] bg-[#fff4f6] px-3 py-2 text-sm text-[#7a2334]">
          {errorMessage}
        </div>
      ) : null}
      <Dialog.Root
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!isRemoving) {
            setIsConfirmOpen(open);
            if (!open) {
              setIsRefundAcknowledged(false);
            }
          }
        }}
      >
        <Dialog.Trigger asChild>
          <button
            type="button"
            disabled={isRemoving}
            className={[
              "inline-flex min-h-12 items-center justify-center rounded-lg border px-5 text-base font-semibold transition",
              className ?? "",
              isRemoving
                ? "cursor-not-allowed border-[#eadada] bg-[#f8f6fb] text-[#b79a9a]"
                : "border-[#d93636] bg-[#d93636] text-white hover:bg-[#bd2d2d]",
            ].join(" ")}
          >
            {isRemoving ? "Deleting..." : "Delete booking"}
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
          <Dialog.Content className="fixed inset-x-3 top-1/2 z-[101] max-h-[86vh] -translate-y-1/2 overflow-hidden border border-[#d8ceeb] bg-white shadow-2xl sm:left-1/2 sm:right-auto sm:w-[min(520px,calc(100vw-32px))] sm:-translate-x-1/2">
            <div className="border-b border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div>
                <Dialog.Title className="text-lg font-bold text-[#24193a]">
                  Delete birthday party booking
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-[#5f5177]">
                  This will permanently delete the booking and reopen the slot for future bookings.
                </Dialog.Description>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5">
              <p className="text-sm text-[#342744]">
                Delete the birthday party booking for{" "}
                <span className="font-semibold text-[#24193a]">{childName}</span> on{" "}
                <span className="font-semibold text-[#24193a]">{slotDateLabel}</span>?
              </p>
              <p className="mt-2 text-sm text-[#6c607d]">
                Warning, this action is permanent and cannot be undone.
              </p>
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[#f0c7cf] bg-[#fff4f6] p-3 text-sm text-[#7a2334]">
                <input
                  type="checkbox"
                  checked={isRefundAcknowledged}
                  onChange={(event) => setIsRefundAcknowledged(event.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[#d6aab4] text-[#d93636] focus:ring-[#d93636]"
                />
                <span>
                  I understand this only removes the birthday party booking from Eagle Gymnastics. Any refund or payment changes must still be handled separately in Stripe.
                </span>
              </label>
            </div>

            <div className="border-t border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={isRemoving}
                    className="h-10 border border-[#ddd4ea] bg-white px-4 text-sm font-semibold text-[#6f6384] hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={() => {
                    if (!isRefundAcknowledged) {
                      return;
                    }
                    void handleDelete();
                  }}
                  disabled={isRemoving || !isRefundAcknowledged}
                  className={[
                    "h-10 border px-4 text-sm font-semibold transition",
                    isRemoving || !isRefundAcknowledged
                      ? "cursor-not-allowed border-[#eadada] bg-[#f8f6fb] text-[#b79a9a]"
                      : "cursor-pointer border-[#d93636] bg-[#d93636] text-white hover:bg-[#bd2d2d]",
                  ].join(" ")}
                >
                  {isRemoving ? "Deleting..." : "Delete booking"}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
