"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Archive } from "lucide-react";

function formatArchivedAt(value: string | null): string {
  if (!value) return "Archived";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Archived";
  return `Archived ${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)}`;
}

export default function ArchiveStudentButton({
  childId,
  studentName,
  isArchived,
  archivedAt,
}: {
  childId: string;
  studentName: string;
  isArchived: boolean;
  archivedAt: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isArchived) {
    return (
      <span className="inline-flex min-h-10 items-center gap-2 border border-[#d9d1e5] bg-[#f7f5fa] px-3.5 text-sm font-semibold text-[#655a75]">
        <Archive className="h-4 w-4" aria-hidden="true" />
        {formatArchivedAt(archivedAt)}
      </span>
    );
  }

  const archiveStudent = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/archive-student", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Unable to archive this student."
        );
      }

      setOpen(false);
      router.push("/admin?tab=students&studentView=archived");
      router.refresh();
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Unable to archive this student."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) return;
        setOpen(nextOpen);
        if (!nextOpen) setError(null);
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#e3a7b4] bg-[#fff6f8] px-3.5 text-sm font-semibold text-[#9e2242] transition hover:border-[#d98799] hover:bg-[#ffedf1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b72c4d]/30"
        >
          <Archive className="h-4 w-4" aria-hidden="true" />
          Archive student
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#160d21]/55" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,500px)] -translate-x-1/2 -translate-y-1/2 border border-[#ddd3ea] bg-white p-6 shadow-[0_24px_70px_rgba(20,10,35,0.3)] focus:outline-none">
          <Dialog.Title className="text-xl font-bold text-[#221833]">
            Archive {studentName}?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[#5f5177]">
            The student will move to Archived Students. Students with an active
            or current class booking cannot be archived.
          </Dialog.Description>

          {error ? (
            <p className="mt-4 border border-[#efc5cf] bg-[#fff4f6] px-3 py-2.5 text-sm font-semibold text-[#9e2242]">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={submitting}
                className="inline-flex min-h-10 items-center justify-center border border-[#d9d1e5] bg-white px-4 text-sm font-semibold text-[#5f536f] hover:bg-[#f8f5fc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={archiveStudent}
              disabled={submitting}
              className="inline-flex min-h-10 items-center justify-center border border-[#a51f40] bg-[#a51f40] px-4 text-sm font-semibold text-white transition hover:bg-[#8f1937] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Archiving..." : "Archive student"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
