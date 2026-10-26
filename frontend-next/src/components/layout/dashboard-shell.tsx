"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, CircleHelp, LayoutDashboard, LogOut, Menu, Settings, Users, Wallet, Trophy, UserRound, ChartNoAxesCombined, X, Sun, Moon, ChevronDown, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/stores/auth-store";
import { LanguageSelector, useLanguage } from "@/components/language-provider";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const admin = role === "admin";
  const nav = admin ? adminNav : agentNav;

  useEffect(() => {
    if (window.localStorage.getItem("edilbet-dashboard-theme") === "light") setTheme("light");
  }, []);

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem("edilbet-dashboard-theme", next);
      return next;
    });
  }
  function signOut() {
    clearUser();
    router.replace("/auth/login");
  }

  return <div data-dashboard-theme={theme} className={clsx("dashboard-root min-h-screen md:flex", theme === "light" ? "dashboard-light" : "dashboard-dark bg-[#090d18] text-slate-100")}>
    {mobile && <button aria-label="Close navigation" onClick={() => setMobile(false)} className="fixed inset-0 z-30 bg-black/60 md:hidden" />}
    <aside className={clsx("dashboard-sidebar fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all md:sticky md:top-0 md:h-screen md:translate-x-0", collapsed ? "w-[84px]" : "w-[250px]", mobile ? "translate-x-0" : "-translate-x-full md:translate-x-0")}>
      <div className="flex h-[76px] shrink-0 items-center gap-3 border-b px-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#9fe870] font-black text-[#10170d]">E</div>
        {!collapsed && <div className="min-w-0 font-bold">EDIL<span className="text-[#9fe870]">BET</span><div className="mt-1 text-[10px] font-normal uppercase tracking-widest dashboard-muted">Operations suite</div></div>}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg dashboard-icon-button md:flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
        <button className="ml-auto md:hidden" onClick={() => setMobile(false)} aria-label="Close menu"><X size={18} /></button>
      </div>
      <div className="px-3 pt-5">{!collapsed && <p className="mb-3 px-3 text-[10px] uppercase tracking-widest dashboard-muted">Workspace</p>}{nav.map(([label, href, Icon]) => <Link key={href} href={href} onClick={() => setMobile(false)} title={collapsed ? label : undefined} className={clsx("mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition-colors", path === href ? "dashboard-nav-active font-semibold" : "dashboard-nav-link")}><Icon size={18} />{!collapsed && t(label)}</Link>)}</div>
    </aside>
    <main className="dashboard-main min-w-0 flex-1">
      <header className="dashboard-header sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-xl md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button className="dashboard-icon-button rounded-xl p-2 md:hidden" onClick={() => setMobile(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="min-w-0"><div className="text-[10px] uppercase tracking-[.16em] dashboard-muted">{t(admin ? "Platform Admin" : "Agent Workspace")}</div><div className="mt-1 text-sm font-semibold">{t(admin ? "Control center" : "Partner performance")}</div></div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSelector compact />
          <button onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Light mode" : "Dark mode"} className="dashboard-icon-button rounded-xl border p-2.5">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
          <button aria-label="Help" title="Help" className="dashboard-icon-button hidden rounded-xl border p-2.5 sm:block"><CircleHelp size={17} /></button>
          <button aria-label="Notifications" title="Notifications" className="dashboard-icon-button rounded-xl border p-2.5"><Bell size={17} /></button>
          <div className="relative ml-1">
            <button onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-haspopup="menu" className="dashboard-profile flex max-w-[210px] items-center gap-2 rounded-xl border px-2 py-2 text-left sm:px-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#9fe870] text-xs font-black text-[#17210f]">{admin ? "A" : "G"}</span>
              <span className="hidden min-w-0 sm:block"><span className="block truncate text-xs font-semibold">{admin ? "Platform Admin" : "Senior Agent"}</span><span className="mt-1 block truncate text-[10px] dashboard-muted">{t(admin ? "Super administrator" : "Partner account")}</span></span>
              <ChevronDown size={14} className="dashboard-muted" />
            </button>
            {profileOpen && <div role="menu" className="dashboard-menu absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border p-2 shadow-xl">
              <div className="border-b px-3 py-2"><div className="text-xs font-semibold">{admin ? "Platform Admin" : "Senior Agent"}</div><div className="mt-1 text-[10px] dashboard-muted">{t(admin ? "Super administrator" : "Partner account")}</div></div>
              <button role="menuitem" onClick={signOut} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm dashboard-signout"><LogOut size={16} />{t("Sign out")}</button>
            </div>}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] p-4 md:p-8">{children}</div>
    </main>
  </div>;
}
