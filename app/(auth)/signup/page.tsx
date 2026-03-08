import Link from "next/link";

export default function SignUpPage() {
  return (
    <div>
      <p className="kicker">Account Creation</p>
      <h1 className="text-3xl font-display mt-2">Start Free</h1>
      <form className="mt-6 space-y-4">
        <input className="w-full rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Email" type="email" />
        <input className="w-full rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Password" type="password" />
        <input className="w-full rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Referral code (optional)" />
        <label className="flex items-start gap-2 text-sm text-muted"><input type="checkbox" className="mt-1" />I consent to secure processing of sensitive personal and health-adjacent records.</label>
        <button type="submit" className="w-full rounded-xl bg-accent text-black py-2.5 font-semibold">Create Account</button>
      </form>
      <p className="mt-4 text-sm text-muted">Already have an account? <Link className="text-accent" href="/login">Log in</Link></p>
    </div>
  );
}