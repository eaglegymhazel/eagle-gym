"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(portal)/(protected)/account/account.module.css";
import ClassRegisterPicker from "@/components/admin/ClassRegisterPicker";
import { buildUpcomingSessions, type RegisterClassTemplate } from "@/components/admin/sessionBuild";

type RegisterPanelProps = {
  referenceNowIso: string;
  registerClasses: RegisterClassTemplate[];
  loadError: string | null;
};

export default function RegisterPanel({
  referenceNowIso,
  registerClasses,
  loadError,
}: RegisterPanelProps) {
  const router = useRouter();
  const registerSessions = useMemo(
    () => buildUpcomingSessions(registerClasses, 14, new Date(referenceNowIso)),
    [referenceNowIso, registerClasses]
  );

  if (loadError) {
    return (
      <div className={styles.errorBanner} role="alert">
        <span>{loadError}</span>
      </div>
    );
  }

  return (
    <ClassRegisterPicker
      sessions={registerSessions}
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
