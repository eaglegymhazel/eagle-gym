"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BookingGateway from "./BookingGateway";
import BookingChildPicker from "./BookingChildPicker";

type ChildItem = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
};

type BookingClientShellProps = {
  childId: string;
  childName: string;
  children: ChildItem[];
  competitionEligible: boolean;
};

export default function BookingClientShell({
  childId,
  childName,
  children,
  competitionEligible,
}: BookingClientShellProps) {
  const router = useRouter();
  const [pendingChildId, setPendingChildId] = useState<string | null>(null);
  const [isSwitchingChild, setIsSwitchingChild] = useState(false);
  const [dataLoadedForChildId, setDataLoadedForChildId] = useState<string | null>(
    null
  );

  useEffect(() => {
    setDataLoadedForChildId(null);
    const id = childId;
    const timer = setTimeout(() => setDataLoadedForChildId(id), 0);
    return () => clearTimeout(timer);
  }, [childId]);

  useEffect(() => {
    if (!pendingChildId) {
      setIsSwitchingChild(false);
      return;
    }
    if (
      childId === pendingChildId &&
      dataLoadedForChildId === pendingChildId
    ) {
      setIsSwitchingChild(false);
      setPendingChildId(null);
    }
  }, [childId, dataLoadedForChildId, pendingChildId]);

  const handleSelectChild = (newChildId: string) => {
    setPendingChildId(newChildId);
    setIsSwitchingChild(true);
    router.replace(`/book?childId=${newChildId}`);
  };

  return (
    <div className="w-full">
      <div className="mb-6 mt-1">
        <BookingChildPicker
          childId={childId}
          children={children}
          onSelectChild={handleSelectChild}
        />
      </div>
      <BookingGateway
        childId={childId}
        childName={childName}
        competitionEligible={competitionEligible}
        isSwitchingChild={isSwitchingChild}
      />
    </div>
  );
}
