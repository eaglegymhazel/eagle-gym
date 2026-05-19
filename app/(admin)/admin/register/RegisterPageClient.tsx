"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import ClassRegisterPicker from "@/components/admin/ClassRegisterPicker";
import {
  buildUpcomingSessions,
  type RegisterClassTemplate,
} from "@/components/admin/sessionBuild";

export default function RegisterPageClient({
  templates,
  referenceNowIso,
}: {
  templates: RegisterClassTemplate[];
  referenceNowIso?: string;
}) {
  const router = useRouter();
  const sessions = useMemo(
    () => buildUpcomingSessions(templates, 14, referenceNowIso ? new Date(referenceNowIso) : new Date()),
    [referenceNowIso, templates]
  );

  return (
    <ClassRegisterPicker
      sessions={sessions}
      referenceNowIso={referenceNowIso}
      onSelect={(session) => {
        const registerDate = session.startAt.slice(0, 10);
        router.push(
          `/admin/register/${encodeURIComponent(session.classId)}?date=${encodeURIComponent(registerDate)}`
        );
      }}
    />
  );
}
