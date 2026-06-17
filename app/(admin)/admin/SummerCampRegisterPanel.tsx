"use client";

import { useRouter } from "next/navigation";
import styles from "@/app/(portal)/(protected)/account/account.module.css";
import ClassRegisterPicker from "@/components/admin/ClassRegisterPicker";
import type { Session } from "@/components/admin/mockSessions";

type SummerCampRegisterPanelProps = {
  referenceNowIso: string;
  sessions: Session[];
  loadError: string | null;
};

export default function SummerCampRegisterPanel({
  referenceNowIso,
  sessions,
  loadError,
}: SummerCampRegisterPanelProps) {
  const router = useRouter();

  if (loadError) {
    return (
      <div className={styles.errorBanner} role="alert">
        <span>{loadError}</span>
      </div>
    );
  }

  return (
    <ClassRegisterPicker
      sessions={sessions}
      referenceNowIso={referenceNowIso}
      heading="Upcoming camp days"
      showHistorical={false}
      programmeOptions={["all"]}
      onSelect={(session) => {
        const registerDate = session.startAt.slice(0, 10);
        router.push(
          `/admin/summer-camp-register/${encodeURIComponent(registerDate)}?slug=${encodeURIComponent(session.classId)}`
        );
      }}
    />
  );
}
