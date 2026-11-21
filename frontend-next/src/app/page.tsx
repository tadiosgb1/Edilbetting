"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

const roleDestinations = {
  admin: "/admin",
  agent: "/agent",
  player: "/player",
} as const;

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persist = useAuthStore.persist;
    if (persist.hasHydrated()) setHydrated(true);
    const unsubscribe = persist.onFinishHydration(() => setHydrated(true));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(user ? roleDestinations[user.role] : "/player");
  }, [hydrated, user, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" aria-label="Loading" />
        <p className="text-sm text-slate-400">Opening your page…</p>
      </div>
    </main>
  );
}
