"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, UserPlus, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { LanguageSelector, useLanguage } from "@/components/language-provider";
import { useAuthStore, type UserRole } from "@/stores/auth-store";
import { login } from "@/services/auth.service";
import { getApiErrorMessage } from "@/services/api-client";
import { useApi } from "@/hooks/use-api";

type AuthMode = "login" | "register";
type AuthPageProps = {
  mode: AuthMode;
  role?: UserRole;
  presentation?: "page" | "modal";
  onClose?: () => void;
  onSuccess?: () => void;
};

const destinations: Record<UserRole, string> = {
  player: "/player",
  agent: "/agent",
  admin: "/admin",
};

export default function AuthPage({
  mode,
  role = (process.env.NEXT_PUBLIC_APP_ROLE || "player") as UserRole,
  presentation = "page",
  onClose,
  onSuccess,
}: AuthPageProps) {
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const [loginRole, setLoginRole] = useState<UserRole>(role);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const loginRequest = useApi(login);
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isModal = presentation === "modal";
  const accentStyle = { "--auth-accent": "var(--player-brand, #16a34a)" } as React.CSSProperties;

  // Keep the login page accessible even if a Player session is already persisted.
  // Otherwise the default Player portal can redirect away before Agent/Admin is selected.

  function notifyError(message: string) {
    setError(message);
    toast(message, "error");
  }

  function switchMode(nextMode: AuthMode) {
    setCurrentMode(nextMode);
    setError("");
    if (!isModal) router.replace(nextMode === "login" ? "/auth/login" : "/auth/register");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (currentMode === "register") {
        notifyError("Registration is not connected yet. Please contact the administrator to create an account.");
        return;
      }

      const submittedEmail = email.trim();
      if (!submittedEmail || !password) {
        notifyError("Enter your email address and password.");
        return;
      }

      const authenticatedUser = await loginRequest.execute({ email: submittedEmail, password });
      // The API response is authoritative: role determines the destination.
      setRedirecting(true);
      window.sessionStorage.removeItem("edilbet-logout-in-progress");
      setUser(authenticatedUser);
      toast("loginSuccess", "success");
      onSuccess?.();
      // Use a full document navigation so the root Player route cannot flash during role transitions.\n      window.location.replace(destinations[authenticatedUser.role]);
    } catch (requestError) {
      notifyError(getApiErrorMessage(requestError, "Unable to sign in. Please check your details and try again."));
    } finally {
      setBusy(false);
    }
  }

  const form = (
    <section style={accentStyle} className={isModal ? "relative w-full max-w-2xl border border-slate-700 bg-slate-900 p-7 text-slate-100" : "w-full max-w-lg text-slate-100"}>
      {isModal && onClose && <button type="button" onClick={onClose} aria-label={t("dismissNotification")} className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18}/></button>}
      <div className="mb-4 flex items-center gap-2 text-[var(--auth-accent)]">
        {currentMode === "login" ? <LockKeyhole size={17}/> : <UserPlus size={17}/>}
        <span className="text-xs font-semibold uppercase tracking-wider">{t(loginRole === "player" ? "playerAccount" : loginRole === "agent" ? "agentAccess" : "adminAccess")}</span>
      </div>
      <h1 className="text-2xl font-bold">{t(currentMode === "login" ? "signIn" : "createAccount")}</h1>
      {currentMode === "login" && <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Choose login portal">{(["player", "agent", "admin"] as UserRole[]).map((portal) => <button key={portal} type="button" onClick={() => setLoginRole(portal)} aria-pressed={loginRole === portal} className={`rounded-lg border px-2 py-2 text-xs font-semibold capitalize ${loginRole === portal ? "border-emerald-400 bg-emerald-500/15 text-emerald-300" : "border-slate-700 bg-slate-950 text-slate-400"}`}>{portal === "admin" ? "Super Admin" : portal}</button>)}</div>}
      <form onSubmit={submit} className="mt-5 space-y-3.5">
        {currentMode === "register" && <div><label htmlFor="auth-name" className="mb-1.5 block text-xs font-medium text-slate-300">{t("name")}</label><input id="auth-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder={t("yourName")} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-[var(--auth-accent)]" /></div>}
        <div><label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-slate-300">Phone number</label><input id="auth-email" type="tel" inputMode="tel" autoComplete="tel" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="+251…" required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-[var(--auth-accent)]" /></div>
        <div><label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-slate-300">{t("password")}</label><input id="auth-password" type="password" autoComplete={currentMode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("password")} minLength={currentMode === "register" ? 4 : undefined} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-[var(--auth-accent)]" /></div>
        {currentMode === "register" && <div><label htmlFor="auth-confirm" className="mb-1.5 block text-xs font-medium text-slate-300">{t("confirmPassword")}</label><input id="auth-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={t("repeatPassword")} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-[var(--auth-accent)]" /></div>}
        {error && <p role="alert" className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">{t(error)}</p>}
        <button type="submit" disabled={busy || redirecting} className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70" style={{ backgroundColor: "var(--auth-accent)" }}>{busy || redirecting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true"/>{redirecting ? "Preparing dashboard…" : "Verifying credentials…"}</> : currentMode === "login" ? <>{t("signIn")} <ArrowRight size={15}/></> : <>{t("createAccount")} <ArrowRight size={15}/></>}</button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-400">
        {t(currentMode === "login" ? "newHere" : "alreadyHaveAccount")}
        {isModal
          ? <button type="button" onClick={() => switchMode(currentMode === "login" ? "register" : "login")} className="font-semibold text-[var(--auth-accent)] hover:opacity-80">{t(currentMode === "login" ? "createAccount" : "signIn")}</button>
          : <Link href={currentMode === "login" ? "/auth/register" : "/auth/login"} onClick={() => setCurrentMode(currentMode === "login" ? "register" : "login")} className="font-semibold text-[var(--auth-accent)] hover:opacity-80">{t(currentMode === "login" ? "createAccount" : "signIn")}</Link>}
      </p>
    </section>
  );

  if (busy || redirecting) {
    const message = redirecting ? "Your account is verified. We're opening the correct dashboard for your role." : "Please wait while we securely verify your credentials and load your account permissions.";
    const loader = <div className="flex flex-col items-center gap-5 text-center"><div className="grid h-16 w-16 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10"><span className="text-xl font-black tracking-wide">E<span className="text-emerald-400">B</span></span></div><div className="text-sm font-bold tracking-[0.18em]">EDILBET</div><div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" aria-label="Loading" /><h1 className="text-base font-semibold">{redirecting ? "Preparing your dashboard…" : "Signing you in…"}</h1><p className="max-w-xs text-sm leading-6 text-slate-400">{message}</p></div>;
    if (isModal) return <main className="fixed inset-0 z-[100] grid min-h-screen place-items-center bg-[#080c16] px-4 text-slate-100" role="status" aria-live="polite">{loader}</main>;
    return <main className="grid min-h-screen place-items-center bg-[#080c16] px-4 text-slate-100" role="status" aria-live="polite">{loader}</main>;
  }

  if (isModal) {
    return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <div role="dialog" aria-modal="true" aria-label={t(currentMode === "login" ? "signIn" : "createAccount")} className="w-full max-w-2xl">{form}</div>
    </div>;
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-slate-950 px-4 py-8">
      <div className="fixed right-4 top-4 z-20">
        <LanguageSelector compact />
      </div>
      {form}
    </main>
  );
}
