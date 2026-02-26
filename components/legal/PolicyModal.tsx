"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export function PolicyModal({
  open,
  onOpenChange,
  title,
  content,
  docId,
  primaryActionLabel,
  onPrimaryAction,
  tertiaryActionLabel,
  onTertiaryAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: ReactNode;
  docId: "waiver" | "photo" | string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  tertiaryActionLabel?: string;
  onTertiaryAction?: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          aria-label={`${title} document`}
          className="fixed inset-0 z-50 grid place-items-center p-4"
        >
          <div className="w-[min(94vw,760px)] rounded-2xl bg-white shadow-xl">
            <div className="border-b px-5 py-4">
              <Dialog.Title className="text-lg font-black text-[#1f1a25]">
                {title}
              </Dialog.Title>
            </div>

            <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
              <div data-doc-id={docId}>{content}</div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8c7f4] bg-white px-4 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
                >
                  Close
                </button>
              </Dialog.Close>
              {tertiaryActionLabel && onTertiaryAction ? (
                <button
                  type="button"
                  onClick={() => {
                    onTertiaryAction();
                    onOpenChange(false);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  {tertiaryActionLabel}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  onPrimaryAction();
                  onOpenChange(false);
                }}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-b from-[#6f3bc9] via-[#6c35c3] to-[#5f2eb6] px-4 text-sm font-semibold text-white transition hover:from-[#6a35c1] hover:via-[#6030b8] hover:to-[#5529a6]"
              >
                {primaryActionLabel}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
