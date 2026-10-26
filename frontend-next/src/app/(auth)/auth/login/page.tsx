"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hashPassword, normalizePhone, useAuthStore, type UserRole } from "@/stores/auth-store";
import { useLanguage } from "@/components/language-provider";

const appRole = (process.env.NEXT_PUBLIC_APP_ROLE || "player") as UserRole;
const destinations: Record<UserRole, string> = { player: "/player", agent: "/agent", admin: "/admin" };
const roleCopy: Record<UserRole, { eyebrow: string; title: string; description: string }> = {
  player: { eyebrow: "PLAYER ACCOUNT", title: "Welcome back.", description: "Sign in with your phone number to follow matches and manage your account." },
  agent: { eyebrow: "AGENT PORTAL", title: "Welcome back.", description: "Sign in to manage your players and partner activity." },
  admin: { eyebrow: "ADMINISTRATION", title: "Welcome back.", description: "Sign in to access platform operations." },
};
const demoAccounts: Record<string, { role: UserRole; name: string }> = {
  "0963275521": { role: "player", name: "Demo Player" },
  "0963275522": { role: "agent", name: "Demo Agent" },
  "0963275523": { role: "admin", name: "Demo Admin" },
};

export default function LoginPage() {
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accounts = useAuthStore((state) => state.accounts);
  const setUser = useAuthStore((state) => state.setUser);
  const copy = roleCopy[appRole] || roleCopy.player;

  useEffect(() => {
    if (user && user.role === appRole) router.replace(destinations[appRole]);
  }, [user, router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const normalized = normalizePhone(phone);
      const demo = demoAccounts[normalized];
      if (demo && password === "1234" && demo.role === appRole) {
        setUser({ id: `demo-${demo.role}`, name: demo.name, phone: normalized, role: demo.role });
        router.replace(destinations[demo.role]);
        return;
      }
      const account = accounts.find((item) => normalizePhone(item.phone) === normalized && item.role === appRole);
      if (account && await hashPassword(password) === account.passwordHash) {
        setUser({ id: `local-${normalized}`, name: account.name, phone: normalized, role: account.role });
        router.replace(destinations[account.role]);
        return;
      }
      setError("Phone number or password is incorrect for this workspace.");
    } catch {
      setError("Unable to sign in in this browser. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-slate-950 text-slate-100 lg:grid lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-slate-800 bg-[radial-gradient(ellipse_at_20%_15%,rgba(245,158,11,.16),transparent_48%),linear-gradient(145deg,#111827,#020617)] p-12 lg:flex">
      <div className="flex items-center gap-1.5 font-black tracking-widest"><span className="rounded bg-amber-400 px-2 py-1 text-lg text-slate-950">EDIL</span><span className="text-lg text-white">BET</span></div>
      <div className="max-w-xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300"><ShieldCheck size={15}/> Phone-based account access</div><h1 className="text-5xl font-black leading-tight xl:text-6xl">Every match.<br/>Every moment.<br/><span className="text-amber-400">Your call.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-slate-400">Your EdilBet account, in one place. Sign in to continue.</p></div>
      <p className="text-xs text-slate-600">© 2026 EdilBet · Play responsibly · 18+ only</p>
    </section>
    <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-[420px]">
      <div className="mb-10 flex items-center gap-1.5 font-black tracking-widest lg:hidden"><span className="rounded bg-amber-400 px-2 py-1 text-lg text-slate-950">EDIL</span><span className="text-lg">BET</span></div>
      <div className="mb-3 inline-flex items-center gap-2 text-xs font-black tracking-[.18em] text-amber-400"><LockKeyhole size={14}/>{copy.eyebrow}</div><h2 className="text-3xl font-black sm:text-4xl">{t(copy.title)}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{copy.description}</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div><label htmlFor="phone" className="mb-2 block text-xs font-bold text-slate-300">{t("Phone number")}</label><Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09XXXXXXXX" required /></div>
        <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="block text-xs font-bold text-slate-300">{t("Password")}</label><span className="text-xs text-slate-500">Demo: 1234</span></div><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></div>
        {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
        <Button className="w-full justify-center" size="lg" type="submit" disabled={busy}>{busy ? "Signing in…" : <>{t("Sign in")} <ArrowRight size={16}/></>}</Button>
        <p className="text-center text-xs text-slate-400">New to EdilBet? <Link href="/auth/register" className="font-bold text-amber-400 hover:text-amber-300">{t("Create an account")}</Link></p>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-[11px] leading-5 text-slate-400"><p className="mb-1 font-bold text-slate-200">Sample login credentials</p><p>Player: 0963275521 · Agent: 0963275522 · Admin: 0963275523</p><p>Password for all three: 1234</p><p className="mt-1 text-slate-500">Local testing only. This is not production authentication.</p></div>
      </form>
    </div></section>
  </main>;
}
