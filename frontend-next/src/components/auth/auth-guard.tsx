"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore, type UserRole } from "@/stores/auth-store";

export function AuthGuard({ role, children }: { role: Extract<UserRole, "admin" | "agent">; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (persistApi.hasHydrated()) setHydrated(true);
    const unsubscribe = persistApi.onFinishHydration(() => setHydrated(true));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!window.sessionStorage.getItem("edilbet-logout-in-progress") && (!user || user.role !== role)) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || (role === "admin" ? "/admin" : "/agent"))}`);
    }
  }, [hydrated, user, role, router, pathname]);

  if (!hydrated || !user || user.role !== role) {
    return <main className="grid min-h-screen place-items-center bg-[#080c16] text-slate-100"><div className="flex flex-col items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10"><span className="text-lg font-black tracking-wide">E<span className="text-emerald-400">B</span></span></div><div className="text-sm font-semibold tracking-wide">EDILBET</div><div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" aria-label="Loading" /><p className="text-sm text-slate-400">Verifying session and preparing dashboard…</p></div></main>;
  }

  return <>{children}</>;
}
