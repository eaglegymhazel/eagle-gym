import { Suspense } from "react";
import AccountShell from "./AccountShell";

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountShell />
    </Suspense>
  );
}
