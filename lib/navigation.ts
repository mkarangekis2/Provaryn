export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/home" },
  { label: "Check-In", href: "/check-in" },
  { label: "Vault", href: "/vault" },
  { label: "Conditions", href: "/conditions" },
  { label: "Claim Plan", href: "/claim-intelligence" }
];

export const secondaryNav: NavItem[] = [
  { label: "AI Chat", href: "/chat" },
  { label: "Transition Mode", href: "/transition" },
  { label: "Benefits", href: "/benefits" },
  { label: "Coach Access", href: "/coach" },
  { label: "Settings", href: "/settings/profile" }
];