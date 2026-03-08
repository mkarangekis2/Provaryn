import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-lg card p-8">{children}</div>
    </div>
  );
}
