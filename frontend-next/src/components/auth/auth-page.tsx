"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, UserPlus, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { LanguageSelector, useLanguage } from "@/components/language-provider";
import { hashPassword, normalizePhone, useAuthStore, type UserRole } from "@/stores/auth-store";

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
const localAccounts: Record<string, { role: UserRole; name: string }> = {
  "0963275521": { role: "player", name: "Player" },
  "0963275522": { role: "agent", name: "Agent" },
  "0963275523": { role: "admin", name: "Administrator" },
};

export default function AuthPage({
  mode,
  role = (process.env.NEXT_PUBLIC_APP_ROLE || "player") as UserRole,
  presentation = "page",
  onClose,
  onSuccess,
}: AuthPageProps) {
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const accounts = useAuthStore((state) => state.accounts);
  const addAccount = useAuthStore((state) => state.addAccount);
  const setUser = useAuthStore((state) => state.setUser);
  const isModal = presentation === "modal";
  const accentStyle = { "--auth-accent": "var(--player-brand, #16a34a)" } as React.CSSProperties;

  useEffect(() => {
    if (!isModal && user?.role === role) router.replace(destinations[role]);
  }, [user, role, router, isModal]);

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
    const normalized = normalizePhone(phone);
    try {
      if (currentMode === "register") {
        if (!name.trim()) {
          notifyError("enterYourName");
          return;
        }
        if (normalized.length !== 10 || !normalized.startsWith("0")) {
          notifyError("enterValidPhone");
          return;
        }
        if (password.length < 4) {
          notifyError("passwordMinLength");
          return;
        }
        if (password !== confirmPassword) {
          notifyError("passwordsDoNotMatch");
          return;
        }
        if (localAccounts[normalized] || accounts.some((item) => normalizePhone(item.phone) === normalized)) {
          notifyError("accountAlreadyExists");
          return;
        }
        const passwordHash = await hashPassword(password);
        const registered = addAccount({ phone: normalized, name: name.trim(), role, passwordHash });
        if (!registered) {
          notifyError("accountAlreadyExists");
          return;
        }
        setUser({ id: `local-${normalized}`, name: name.trim(), phone: normalized, role });
      } else {
        const account = accounts.find((item) => normalizePhone(item.phone) === normalized && item.role === role);
        if (account) {
          if (await hashPassword(password) !== account.passwordHash) {
            notifyError("invalidCredentials");
            return;
          }
          setUser({ id: `local-${normalized}`, name: account.name, phone: normalized, role: account.role });
        } else {
          const localAccount = localAccounts[normalized];
          if (!localAccount || password !== "1234" || localAccount.role !== role) {
            notifyError("invalidCredentials");
            return;
          }
          setUser({ id: `account-${localAccount.role}`, name: localAccount.name, phone: normalized, role });
        }
      }
      toast(currentMode === "login" ? "loginSuccess" : "registrationSuccess", "success");
      if (onSuccess) onSuccess();
      else router.replace(destinations[role]);
    } catch {
      notifyError(currentMode === "login" ? "loginFailed" : "registrationFailed");
    } finally {
      setBusy(false);
    }
  }

  const form = (
    <section style={accentStyle} className={isModal ? "relative w-full max-w-2xl border border-slate-700 bg-slate-900 p-7 text-slate-100" : "w-full max-w-lg text-slate-100"}>
      {isModal && onClose && <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18}/></button>}
      <div className="mb-4 flex items-center gap-2 text-[var(--auth-accent)]">
        {currentMode === "login" ? <LockKeyhole size={17}/> : <UserPlus size={17}/>}
        <span className="text-xs font-semibold uppercase tracking-wider">{t(role === "player" ? "playerAccount" : role === "agent" ? "agentAccess" : "adminAccess")}</span>
      </div>
      <h1 className="text-2xl font-bold">{t(currentMode === "login" ? "signIn" : "createAccount")}</h1>
      <form onSubmit={submit} className="mt-5 space-y-3.5">
        {currentMode === "register" && <div><label htmlFor="auth-name" className="mb-1.5 block text-xs font-medium text-slate-300">{t("name")}</label><input id="auth-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder={t("yourName")} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-[var(--auth-accent)]" /></div>}
        <div><label htmlFor="auth-phone" className="mb-1.5 block text-xs font-medium text-slate-300">{t("phoneNumber")}</label><input id="auth-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09XXXXXXXX" required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-[var(--auth-accent)]" /></div>
        <div><label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-slate-300">{t("password")}</label><input id="auth-password" type="password" autoComplete={currentMode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("password")} minLength={currentMode === "register" ? 4 : undefined} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-[var(--auth-accent)]" /></div>
        {currentMode === "register" && <div><label htmlFor="auth-confirm" className="mb-1.5 block text-xs font-medium text-slate-300">{t("confirmPassword")}</label><input id="auth-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={t("repeatPassword")} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-[var(--auth-accent)]" /></div>}
        {error && <p role="alert" className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">{t(error)}</p>}
        <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "var(--auth-accent)" }}>{busy ? t("pleaseWait") : currentMode === "login" ? <>{t("signIn")} <ArrowRight size={15}/></> : <>{t("createAccount")} <ArrowRight size={15}/></>}</button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-400">
        {t(currentMode === "login" ? "newHere" : "alreadyHaveAccount")}
        {isModal
          ? <button type="button" onClick={() => switchMode(currentMode === "login" ? "register" : "login")} className="font-semibold text-[var(--auth-accent)] hover:opacity-80">{t(currentMode === "login" ? "createAccount" : "signIn")}</button>
          : <Link href={currentMode === "login" ? "/auth/register" : "/auth/login"} onClick={() => setCurrentMode(currentMode === "login" ? "register" : "login")} className="font-semibold text-[var(--auth-accent)] hover:opacity-80">{currentMode === "login" ? "Create account" : "Sign in"}</Link>}
      </p>
    </section>
  );

  if (isModal) {
    return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <div role="dialog" aria-modal="true" aria-label={currentMode === "login" ? "Sign in" : "Create account"} className="w-full max-w-2xl">{form}</div>
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
