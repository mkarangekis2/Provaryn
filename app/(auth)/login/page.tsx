import Link from "next/link";

export default function LoginPage() {
  return (
    <div>
      <p className="kicker">Secure Access</p>
      <h1 className="text-3xl font-display mt-2">Log In</h1>
      <form className="mt-6 space-y-4">
        <input className="w-full rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Email" type="email" />
        <input className="w-full rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Password" type="password" />
        <button type="submit" className="w-full rounded-xl bg-accent text-black py-2.5 font-semibold">Continue</button>
      </form>
      <div className="mt-4 flex justify-between text-sm"><Link className="text-muted hover:text-text" href="/password-reset">Forgot password</Link><Link className="text-muted hover:text-text" href="/mfa-setup">Setup MFA</Link></div>
    </div>
  );
}