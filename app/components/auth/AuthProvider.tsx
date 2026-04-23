"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: string | null;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadRole = async (nextUser: User | null) => {
      if (!active) return;
      if (!nextUser) {
        setRole(null);
        return;
      }

      try {
        const response = await fetch("/api/auth/role", {
          credentials: "include",
          cache: "no-store",
        });

        if (!active) return;

        if (!response.ok) {
          setRole(null);
          return;
        }

        const data = (await response.json()) as { role?: unknown };
        setRole(typeof data.role === "string" ? data.role : null);
      } catch {
        if (!active) return;
        setRole(null);
      }
    };

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        const nextSession = data.session ?? null;
        const nextUser = nextSession?.user ?? null;
        setSession(nextSession);
        setUser(nextUser);
        await loadRole(nextUser);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        const nextUser = nextSession?.user ?? null;
        setUser(nextUser);
        await loadRole(nextUser);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, user, loading, role, isAdmin: role === "admin" }),
    [session, user, loading, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
