export default function PasswordResetPage() {
  return (
    <div>
      <p className="kicker">Account Recovery</p>
      <h1 className="text-3xl font-display mt-2">Reset Password</h1>
      <form className="mt-6 space-y-4">
        <input className="w-full rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Email" type="email" />
        <button type="submit" className="w-full rounded-xl bg-accent text-black py-2.5 font-semibold">Send Reset Link</button>
      </form>
    </div>
  );
}