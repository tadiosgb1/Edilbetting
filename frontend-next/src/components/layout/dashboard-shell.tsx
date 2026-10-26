"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, ChevronLeft, ChevronRight, CircleHelp, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Users, Wallet, Trophy, UserRound, ChartNoAxesCombined, X } from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/stores/auth-store";
import { useLanguage } from "@/components/language-provider";

type Role = "admin" | "agent";
const adminNav = [["Overview", "/admin", LayoutDashboard], ["Players", "/admin/players", Users], ["Agents", "/admin/agents", UserRound], ["Bets & Markets", "/admin/bets", Trophy], ["Transactions", "/admin/transactions", Wallet], ["Reports", "/admin/reports", ChartNoAxesCombined], ["Settings", "/admin/settings", Settings]] as const;
const agentNav = [["Overview", "/agent", LayoutDashboard], ["My Players", "/agent/players", Users], ["Bets", "/agent/bets", Trophy], ["Wallet & Payouts", "/agent/wallet", Wallet], ["Commissions", "/agent/commissions", ChartNoAxesCombined], ["Settings", "/agent/settings", Settings]] as const;

export function DashboardShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const { t } = useLanguage();
  const path = usePathname();
  const router = useRouter();
  const clearUser = useAuthStore((state) => state.clearUser);
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const admin = role === "admin";
  const nav = admin ? adminNav : agentNav;
  function signOut() {
    clearUser();
    router.replace("/auth/login");
  }

  return <div className="min-h-screen bg-[#090d18] md:flex">
    {mobile && <button aria-label="Close navigation" onClick={() => setMobile(false)} className="fixed inset-0 z-30 bg-black/60 md:hidden" />}
    <aside className={clsx("fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#253148] bg-[#0d1422] transition-all md:sticky md:top-0 md:h-screen md:translate-x-0", collapsed ? "w-[84px]" : "w-[250px]", mobile ? "translate-x-0" : "-translate-x-full md:translate-x-0")}>
      <div className="flex h-[76px] items-center gap-3 border-b border-[#253148] px-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#9fe870] font-black text-[#10170d]">E</div>{!collapsed && <div className="font-bold">EDIL<span className="text-[#9fe870]">BET</span><div className="mt-1 text-[10px] font-normal uppercase tracking-widest text-[#7f8da5]">Operations suite</div></div>}<button className="ml-auto md:hidden" onClick={() => setMobile(false)} aria-label="Close menu"><X size={18} /></button></div>
      <div className="px-3 pt-5">{!collapsed && <p className="mb-3 px-3 text-[10px] uppercase tracking-widest text-[#64738d]">Workspace</p>}{nav.map(([label, href, Icon]) => <Link key={href} href={href} onClick={() => setMobile(false)} title={collapsed ? label : undefined} className={clsx("mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-[13px]", path === href ? "bg-[#9fe870]/10 font-semibold text-[#b5f391]" : "text-[#95a3ba] hover:bg-[#182337] hover:text-white")}><Icon size={18} />{!collapsed && t(label)}</Link>)}</div>
      <div className="mt-auto p-3"><div className="mb-3 rounded-xl border border-[#253148] bg-[#111b2b] p-3">{!collapsed && <><div className="flex gap-2 text-xs font-semibold"><ShieldCheck size={15} className="text-[#9fe870]" />Secure workspace</div><p className="mt-2 text-[11px] leading-5 text-[#7f8da5]">UI preview; API permissions required.</p></>}</div><button onClick={() => setCollapsed(!collapsed)} className="hidden w-full justify-center py-2 text-[#7f8da5] md:flex">{collapsed ? <ChevronRight size={17} /> : <><ChevronLeft size={17} /><span className="ml-2 text-xs">Collapse sidebar</span></>}</button><button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#95a3ba] hover:bg-[#182337]"><LogOut size={17} />{!collapsed && t("Sign out")}</button></div>
    </aside>
    <main className="min-w-0 flex-1"><header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#253148] bg-[#090d18]/90 px-4 backdrop-blur-xl md:px-8"><div className="flex items-center gap-3"><button className="md:hidden" onClick={() => setMobile(true)} aria-label="Open navigation"><Menu size={21} /></button><div><div className="text-[10px] uppercase tracking-[.16em] text-[#74839b]">{t(admin ? "Platform Admin" : "Agent Workspace")}</div><div className="mt-1 text-sm font-semibold">{t(admin ? "Control center" : "Partner performance")}</div></div></div><div className="flex items-center gap-2"><button aria-label="Help" className="hidden rounded-xl border border-[#253148] p-2.5 text-[#9ba9bf] sm:block"><CircleHelp size={17} /></button><button aria-label="Notifications" className="rounded-xl border border-[#253148] p-2.5 text-[#9ba9bf]"><Bell size={17} /></button><div className="ml-2 border-l border-[#253148] pl-3"><div className="text-xs font-semibold">{admin ? "Platform Admin" : "Senior Agent"}</div><div className="mt-1 text-[10px] text-[#7f8da5]">{t(admin ? "Super administrator" : "Partner account")}</div></div></div></header><div className="mx-auto max-w-[1600px] p-4 md:p-8">{children}</div></main>
  </div>;
}
