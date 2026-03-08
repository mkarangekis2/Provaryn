import { SignupForm } from "@/features/auth/signup-form";

export default function SignUpPage() {
  return (
    <div>
      <p className="kicker">Account Creation</p>
      <h1 className="text-3xl font-display mt-2">Start Free</h1>
      <SignupForm />
    </div>
  );
}
