"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, UserPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hashPassword, normalizePhone, useAuthStore, type UserRole } from "@/stores/auth-store";

const appRole = (process.env.NEXT_PUBLIC_APP_ROLE || "player") as UserRole;
const destinations: Record<UserRole, string> = { player: "/player", agent: "/agent", admin: "/admin" };

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const accounts = useAuthStore((state) => state.accounts);
  const addAccount = useAuthStore((state) => state.addAccount);
  const setUser = useAuthStore((state) => state.setUser);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalized = normalizePhone(phone);
    if (normalized.length !== 10 || !normalized.startsWith("0")) {
      setError("Enter a valid 10-digit phone number starting with 0.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (["0963275521", "0963275522", "0963275523"].includes(normalized) ||
        accounts.some((account) => normalizePhone(account.phone) === normalized)) {
      setError("An account with this phone number already exists.");
      return;
    }
    setBusy(true);
    try {
      const passwordHash = await hashPassword(password);
      const registered = addAccount({ phone: normalized, name: name.trim(), role: appRole, passwordHash });
      if (!registered) {
        setError("An account with this phone number already exists.");
        return;
      }
      setUser({ id: `local-${normalized}`, name: name.trim(), phone: normalized, role: appRole });
      router.replace(destinations[appRole] || "/player");
    } catch {
      setError("Registration failed in this browser. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10 text-slate-100">
    <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
      <div className="mb-6 flex items-center gap-2 text-amber-400"><ShieldCheck size={18}/><span className="text-xs font-black tracking-[.18em]">{appRole.toUpperCase()} ACCOUNT</span></div>
      <h1 className="text-3xl font-black">Create your account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">Register with your phone number for the {appRole} workspace.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <div><label htmlFor="name" className="mb-2 block text-xs font-bold text-slate-300">Full name</label><Input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required /></div>
        <div><label htmlFor="phone" className="mb-2 block text-xs font-bold text-slate-300">Phone number</label><Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09XXXXXXXX" required /></div>
        <div><label htmlFor="password" className="mb-2 block text-xs font-bold text-slate-300">Password</label><Input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 4 characters" minLength={4} required /></div>
        <div><label htmlFor="confirmPassword" className="mb-2 block text-xs font-bold text-slate-300">Confirm password</label><Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" required /></div>
        {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
        <Button className="w-full justify-center" size="lg" type="submit" disabled={busy}>{busy ? "Creating account…" : <>Create account <UserPlus size={16}/><ArrowRight size={16}/></>}</Button>
      </form>
      <p className="mt-5 text-center text-xs text-slate-400">Already registered? <Link href="/auth/login" className="font-bold text-amber-400 hover:text-amber-300">Sign in</Link></p>
      <p className="mt-5 text-[10px] leading-5 text-slate-500">Local demo registration stores account data in this browser only. Use a real backend and secure server-side sessions before production.</p>
    </section>
  </main>;
}
