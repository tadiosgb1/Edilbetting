"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const roleRoutes: Record<string, string> = {
  player: "/player",
  admin: "/admin",
  agent: "/agent",
};

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const role = process.env.NEXT_PUBLIC_EDILBET_ROLE || "player";
    router.replace(roleRoutes[role] || "/player");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <p className="text-sm text-slate-400">Loading EdilBet…</p>
    </main>
  );
}
