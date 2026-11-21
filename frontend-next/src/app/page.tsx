import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-black tracking-wide">EDILBET<span className="text-emerald-400">.</span></Link>
        <Link href="/auth/login" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold transition hover:border-emerald-400 hover:text-emerald-300">Sign in</Link>
      </header>
      <section className="mx-auto flex min-h-[75vh] max-w-7xl flex-col justify-center px-6 py-16">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Welcome to Edilbet</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">Your sports. Your action. Your platform.</h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">Explore the platform, sign in to your account, and continue to your personalized dashboard.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/auth/login" className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">Sign in to continue</Link>
          <Link href="/player" className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold transition hover:border-slate-500">Explore sports</Link>
        </div>
      </section>
      <footer className="mx-auto max-w-7xl border-t border-slate-800 px-6 py-5 text-xs text-slate-500">© Edilbet</footer>
    </main>
  );
}
