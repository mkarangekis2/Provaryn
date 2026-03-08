"use client";

import { useEffect, useMemo, useState } from "react";
import { setClientUserId } from "@/lib/client-user";
import type { AppRole } from "@/types/domain";

type SessionUser = {
  userId: string;
  email?: string;
  roles: AppRole[];
  primaryRole: AppRole;
};

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const payload = (await response.json()) as
          | { ok: true; user: SessionUser }
          | { ok: false; error?: string };

        if (!active) return;
        if (!response.ok || !payload.ok) {
          setUser(null);
          setError(payload.ok ? null : (payload.error ?? "Failed to load session"));
          return;
        }

        setClientUserId(payload.user.userId);
        setUser(payload.user);
      } catch (err) {
        if (!active) return;
        setUser(null);
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return useMemo(
    () => ({
      user,
      loading,
      error,
      hasRole: (role: AppRole) => Boolean(user?.roles.includes(role))
    }),
    [user, loading, error]
  );
}

