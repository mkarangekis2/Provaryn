import { PasswordResetForm } from "@/features/auth/password-reset-form";

export default function PasswordResetPage() {
  return (
    <div>
      <p className="kicker">Account Recovery</p>
      <h1 className="text-3xl font-display mt-2">Reset Password</h1>
      <PasswordResetForm />
    </div>
  );
}
