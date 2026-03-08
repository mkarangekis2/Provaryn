import { MfaSetupPanel } from "@/features/auth/mfa-setup-panel";

export default async function MfaSetupPage({
  searchParams
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const redirectTo = params?.redirect ?? "/home";
  return <MfaSetupPanel redirectTo={redirectTo} />;
}
