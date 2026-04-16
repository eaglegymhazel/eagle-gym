"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export function Modal({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="w-[min(92vw,560px)] max-h-[min(92dvh,720px)] overflow-auto rounded-2xl bg-white shadow-xl">
            <div className="border-b px-4 py-3">
              <Dialog.Title className="text-base font-semibold">
                {title}
              </Dialog.Title>
            </div>
            <div className="p-4">{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
