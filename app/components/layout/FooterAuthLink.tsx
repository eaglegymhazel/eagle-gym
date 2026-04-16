"use client";

import Link from "next/link";
import { useAuth } from "@/app/components/auth/AuthProvider";

export default function FooterAuthLink() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user?.email);

  return (
    <Link href={isLoggedIn ? "/account" : "/login"} className="hover:underline">
      {isLoggedIn ? "Account" : "Login"}
    </Link>
  );
}
