import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="card p-10 max-w-lg text-center">
        <p className="kicker">404</p>
        <h1 className="text-3xl font-display mt-3">Route Not Found</h1>
        <p className="text-muted mt-3">The page you requested is unavailable or requires different permissions.</p>
        <Link href="/" className="inline-flex mt-6 rounded-xl bg-accent px-5 py-2.5 text-black font-semibold">Return Home</Link>
      </div>
    </main>
  );
}