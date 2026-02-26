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
}: {
  templates: RegisterClassTemplate[];
}) {
  const router = useRouter();
  const sessions = useMemo(() => buildUpcomingSessions(templates, 14), [templates]);

  return (
    <ClassRegisterPicker
      sessions={sessions}
      onSelect={(session) => {
        const registerDate = session.startAt.slice(0, 10);
        router.push(
          `/admin/register/${encodeURIComponent(session.classId)}?date=${encodeURIComponent(registerDate)}`
        );
      }}
    />
  );
}
