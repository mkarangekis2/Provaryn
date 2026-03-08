"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { AppRole } from "@/types/domain";
import { useSessionUser } from "@/lib/auth/use-session-user";

export function RoleGate({
  allow,
  title,
  children
}: {
  allow: AppRole[];
  title: string;
  children: ReactNode;
}) {
  const { loading, user, error } = useSessionUser();

  if (loading) {
    return <Card className="p-6">Loading access controls...</Card>;
  }

  if (!user) {
    return (
      <Card className="p-6 space-y-3">
        <h1 className="text-2xl font-display">{title}</h1>
        <p className="text-sm text-muted">{error ?? "Session unavailable. Please sign in again."}</p>
        <Link href="/login" className="inline-flex rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">
          Go to Login
        </Link>
      </Card>
    );
  }

  const allowed = user.roles.some((role) => allow.includes(role));
  if (!allowed) {
    return (
      <Card className="p-6 space-y-3">
        <h1 className="text-2xl font-display">Access Restricted</h1>
        <p className="text-sm text-muted">
          Your role does not include access to {title.toLowerCase()}. Current role: <span className="font-semibold text-text">{user.primaryRole}</span>
        </p>
        <Link href="/home" className="inline-flex rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">
          Return Home
        </Link>
      </Card>
    );
  }

  return <>{children}</>;
}

