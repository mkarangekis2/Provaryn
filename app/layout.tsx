import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Valor Claims OS",
  description: "AI Military Career OS + VA Claim Optimization Platform"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
