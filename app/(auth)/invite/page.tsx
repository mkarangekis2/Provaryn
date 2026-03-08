import { InviteAcceptPanel } from "@/features/auth/invite-accept-panel";

export default async function InvitePage({
  searchParams
}: {
  searchParams?: Promise<{ token_hash?: string; email?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  return <InviteAcceptPanel tokenHash={params?.token_hash ?? null} email={params?.email ?? null} />;
}
