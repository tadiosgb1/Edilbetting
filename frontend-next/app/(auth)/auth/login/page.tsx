"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore, type UserRole } from "@/stores/auth-store";

const appRole = (process.env.NEXT_PUBLIC_APP_ROLE || "player") as UserRole;
const destinations: Record<UserRole, string> = {
  player: "/player",
  agent: "/agent",
  admin: "/admin",
};
const roleCopy: Record<UserRole, { eyebrow: string; title: string; description: string }> = {
  player: { eyebrow: "PLAYER ACCOUNT", title: "Welcome back.", description: "Sign in to follow your matches and manage your account." },
  agent: { eyebrow: "AGENT PORTAL", title: "Welcome back.", description: "Sign in to manage your players and partner activity." },
  admin: { eyebrow: "ADMINISTRATION", title: "Welcome back.", description: "Sign in to access platform operations." },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const copy = roleCopy[appRole] || roleCopy.player;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Preview flow only; replace with the real authentication service before production.
    setUser({
      id: "preview-user",
      name: email.split("@")[0] || "Guest",
      role: appRole in destinations ? appRole : "player",
    });
    router.push(destinations[appRole] || "/player");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 lg:grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-slate-800 bg-[radial-gradient(ellipse_at_20%_15%,rgba(245,158,11,.16),transparent_48%),linear-gradient(145deg,#111827,#020617)] p-12 lg:flex">
        <div className="flex items-center gap-1.5 font-black tracking-widest">
          <span className="rounded bg-amber-400 px-2 py-1 text-lg text-slate-950">EDIL</span>
          <span className="text-lg text-white">BET</span>
        </div>
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300">
            <ShieldCheck size={15} /> Secure account access
          </div>
          <h1 className="text-5xl font-black leading-tight xl:text-6xl">Every match.<br />Every moment.<br /><span className="text-amber-400">Your call.</span></h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">Your EdilBet account, in one place. Sign in to continue.</p>
        </div>
        <p className="text-xs text-slate-600">© 2026 EdilBet · Play responsibly · 18+ only</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-1.5 font-black tracking-widest lg:hidden">
            <span className="rounded bg-amber-400 px-2 py-1 text-lg text-slate-950">EDIL</span>
            <span className="text-lg">BET</span>
          </div>
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-black tracking-[.18em] text-amber-400"><LockKeyhole size={14} /> {copy.eyebrow}</div>
          <h2 className="text-3xl font-black sm:text-4xl">{copy.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{copy.description}</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-bold text-slate-300">Email address</label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="block text-xs font-bold text-slate-300">Password</label><span className="text-xs text-slate-500">Forgot password?</span></div>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
            </div>
            <Button className="w-full justify-center" size="lg" type="submit">Sign in <ArrowRight size={16} /></Button>
            <p className="text-center text-[11px] leading-5 text-slate-500">Preview sign-in only. Connect the authentication API before production.</p>
          </form>
        </div>
      </section>
    </main>
  );
}
