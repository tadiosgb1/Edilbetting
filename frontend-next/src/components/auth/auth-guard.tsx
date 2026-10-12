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
    if (!user || user.role !== role) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || (role === "admin" ? "/admin" : "/agent"))}`);
    }
  }, [hydrated, user, role, router, pathname]);

  if (!hydrated || !user || user.role !== role) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-300"><p className="text-sm">Checking your session…</p></main>;
  }

  return <>{children}</>;
}
