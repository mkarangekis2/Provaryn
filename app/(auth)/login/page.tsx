import { LoginForm } from "@/features/auth/login-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const redirect = params?.redirect ?? "/home";
  return (
    <div>
      <p className="kicker">Secure Access</p>
      <h1 className="text-3xl font-display mt-2">Log In</h1>
      <LoginForm redirectTo={redirect} />
    </div>
  );
}
