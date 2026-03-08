import Link from "next/link";
import { Shield } from "lucide-react";
import type { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <span className="font-display">Valor Claims OS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-text">Log in</Link>
            <Link href="/signup" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black">Start Free</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
