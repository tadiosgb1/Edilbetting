"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import PlayerPage from "@/app/(player)/player/page";

/** Read the persisted role directly from localStorage without waiting for Zustand hydration. */
function getPersistedRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("edilbet-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { user?: { role?: string } } };
    return parsed?.state?.user?.role ?? null;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const user = useAuthStore((state) => state.user);

  // Read role synchronously from localStorage so the very first render already
  // knows whether to show the loading screen. This avoids a flash of PlayerPage.
  const [initialRole] = useState<string | null>(() => getPersistedRole());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (persistApi.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsubscribe = persistApi.onFinishHydration(() => setHydrated(true));
      return unsubscribe;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role === "admin") window.location.replace("/admin");
    else if (user?.role === "agent") window.location.replace("/agent");
  }, [hydrated, user]);

  // The effective role: once hydrated use the live store value, otherwise fall
  // back to what we read synchronously from localStorage on first render.
  const effectiveRole = hydrated ? (user?.role ?? null) : initialRole;

  // Keep showing the loading screen until we know the role is "player" (or null = guest).
  if (effectiveRole === "admin" || effectiveRole === "agent") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080c16] px-4 text-slate-100">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10">
            <span className="text-xl font-black tracking-wide">
              E<span className="text-emerald-400">B</span>
            </span>
          </div>
          <div className="text-sm font-bold tracking-[0.18em]">EDILBET</div>
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400"
            aria-label="Loading"
          />
          <p className="max-w-xs text-sm leading-6 text-slate-400">
            Preparing your dashboard…
          </p>
        </div>
      </main>
    );
  }

  // Players and guests see the homepage immediately once we know their role.
  // During the brief initial hydration window (effectiveRole is null/unknown)
  // also show the player page — guests and players should not see a loading flash.
  return <PlayerPage />;
}
