"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, CircleHelp, LayoutDashboard, LogOut, Menu, Settings, Users, Wallet, Trophy, UserRound, ChartNoAxesCombined, X, Sun, Moon, ChevronDown, ShieldCheck, Palette } from "lucide-react";
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
  const [brandPanelOpen, setBrandPanelOpen] = useState(false);
  const [brandColor, setBrandColor] = useState("#16a34a");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [darkPalette, setDarkPalette] = useState<"coffee" | "slate" | "midnight">("coffee");
  const admin = role === "admin";
  const nav = admin ? adminNav : agentNav;

  useEffect(() => {
    if (window.localStorage.getItem("edilbet-dashboard-theme") === "light") setTheme("light");
    const savedPalette = window.localStorage.getItem("edilbet-dashboard-dark-palette");
    if (savedPalette === "coffee" || savedPalette === "slate" || savedPalette === "midnight") setDarkPalette(savedPalette);
    const savedBrand = window.localStorage.getItem("edilbet-dashboard-brand");
    if (savedBrand && /^#[0-9a-fA-F]{6}$/.test(savedBrand)) setBrandColor(savedBrand);
  }, []);

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem("edilbet-dashboard-theme", next);
      return next;
    });
  }
  function changeDarkPalette(palette: "coffee" | "slate" | "midnight") {
    setDarkPalette(palette);
    window.localStorage.setItem("edilbet-dashboard-dark-palette", palette);
  }
  function changeBrand(color: string) {
    setBrandColor(color);
    window.localStorage.setItem("edilbet-dashboard-brand", color);
  }
  function signOut() {
    clearUser();
    router.replace("/auth/login");
  }

  return <div style={{ "--brand": brandColor } as React.CSSProperties} data-dashboard-theme={theme} data-dashboard-palette={darkPalette} className={clsx("dashboard-root min-h-screen md:flex", theme === "light" ? "dashboard-light" : "dashboard-dark bg-[#090d18] text-slate-100")}>
    {mobile && <button aria-label="Close navigation" onClick={() => setMobile(false)} className="fixed inset-0 z-30 bg-black/60 md:hidden" />}
    <aside className={clsx("dashboard-sidebar fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all md:sticky md:top-0 md:h-screen md:translate-x-0", collapsed ? "w-[84px]" : "w-[250px]", mobile ? "translate-x-0" : "-translate-x-full md:translate-x-0")}>
      <div className="flex h-[76px] shrink-0 items-center gap-3 border-b px-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#9fe870] font-black text-[#10170d]">E</div>
        {!collapsed && <div className="min-w-0 font-bold">EDIL<span className="text-[#9fe870]">BET</span></div>}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg dashboard-icon-button md:flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
        <button className="ml-auto md:hidden" onClick={() => setMobile(false)} aria-label="Close menu"><X size={18} /></button>
      </div>
      <div className="px-3 pt-5">{nav.map(([label, href, Icon]) => <Link key={href} href={href} onClick={() => setMobile(false)} title={collapsed ? label : undefined} className={clsx("mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition-colors", path === href ? "dashboard-nav-active font-semibold" : "dashboard-nav-link")}><Icon size={18} />{!collapsed && t(label)}</Link>)}</div>
    </aside>
    <main className="dashboard-main min-w-0 flex-1">
      <header className="dashboard-header sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-xl md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button className="dashboard-icon-button rounded-xl p-2 md:hidden" onClick={() => setMobile(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="min-w-0"><div className="text-sm font-semibold">{t(admin ? "Admin" : "Agent")}</div></div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSelector compact />
          <button onClick={() => setBrandPanelOpen((open) => !open)} aria-label="Customize appearance" title="Appearance" className="dashboard-icon-button rounded-xl border p-2.5"><Palette size={17} /></button>
          <button onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Light mode" : "Dark mode"} className="dashboard-icon-button rounded-xl border p-2.5">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
          <button aria-label="Help" title="Help" className="dashboard-icon-button hidden rounded-xl border p-2.5 sm:block"><CircleHelp size={17} /></button>
          <button aria-label="Notifications" title="Notifications" className="dashboard-icon-button rounded-xl border p-2.5"><Bell size={17} /></button>
          <div className="relative ml-1">
            <button onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-haspopup="menu" className="dashboard-profile flex max-w-[210px] items-center gap-2 rounded-xl border px-2 py-2 text-left sm:px-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#9fe870] text-xs font-black text-[#17210f]">{admin ? "A" : "G"}</span>
              <span className="hidden min-w-0 sm:block"><span className="block truncate text-xs font-semibold">{admin ? t("Admin") : t("Agent")}</span><span className="mt-1 block truncate text-[10px] dashboard-muted">{t(admin ? "Administrator" : "Agent account")}</span></span>
              <ChevronDown size={14} className="dashboard-muted" />
            </button>
            {profileOpen && <div role="menu" className="dashboard-menu absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border p-2 shadow-xl">
              <div className="border-b px-3 py-2"><div className="text-xs font-semibold">{admin ? t("Admin") : t("Agent")}</div><div className="mt-1 text-[10px] dashboard-muted">{t(admin ? "Administrator" : "Agent account")}</div></div>
              <button role="menuitem" onClick={signOut} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm dashboard-signout"><LogOut size={16} />{t("Sign out")}</button>
            </div>}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] p-4 md:p-8">{children}</div>
    </main>
    {brandPanelOpen && <><button aria-label="Close brand settings" onClick={() => setBrandPanelOpen(false)} className="fixed inset-0 z-40 bg-black/30" /><aside aria-label="Brand appearance settings" className="dashboard-brand-panel fixed inset-y-0 right-0 z-50 w-[300px] max-w-[88vw] overflow-y-auto overscroll-contain border-l p-5 shadow-2xl"><div className="mb-6 flex items-center justify-between"><h2 className="text-sm font-semibold">Brand appearance</h2><button onClick={() => setBrandPanelOpen(false)} aria-label="Close brand settings" className="dashboard-icon-button rounded-lg p-2"><X size={17} /></button></div><p className="mb-3 text-xs dashboard-muted">Customize dashboard theme and accent colors. Preferences are saved in this browser.</p><h3 className="mb-2 text-xs font-semibold">Appearance</h3><div className="mb-5 grid grid-cols-2 gap-2"><button onClick={() => { setTheme("dark"); window.localStorage.setItem("edilbet-dashboard-theme", "dark"); }} className={clsx("rounded-xl border p-3 text-xs font-medium", theme === "dark" ? "dashboard-brand-choice-active" : "dashboard-brand-choice")}>Dark mode</button><button onClick={() => { setTheme("light"); window.localStorage.setItem("edilbet-dashboard-theme", "light"); }} className={clsx("rounded-xl border p-3 text-xs font-medium", theme === "light" ? "dashboard-brand-choice-active" : "dashboard-brand-choice")}>Light mode</button></div><h3 className="mb-2 text-xs font-semibold">Dark mode colors</h3><div className="mb-5 grid grid-cols-1 gap-2"><button onClick={() => changeDarkPalette("coffee")} className={clsx("flex items-center gap-3 rounded-xl border p-3 text-xs font-medium", darkPalette === "coffee" ? "dashboard-brand-choice-active" : "dashboard-brand-choice")}><span className="flex gap-1"><i className="h-5 w-5 rounded-full bg-[#211812]" /><i className="h-5 w-5 rounded-full bg-[#f97316]" /></span>Coffee & orange {darkPalette === "coffee" && <span className="ml-auto">✓</span>}</button><button onClick={() => changeDarkPalette("slate")} className={clsx("flex items-center gap-3 rounded-xl border p-3 text-xs font-medium", darkPalette === "slate" ? "dashboard-brand-choice-active" : "dashboard-brand-choice")}><span className="flex gap-1"><i className="h-5 w-5 rounded-full bg-[#172033]" /><i className="h-5 w-5 rounded-full bg-[#60a5fa]" /></span>Slate & blue {darkPalette === "slate" && <span className="ml-auto">✓</span>}</button><button onClick={() => changeDarkPalette("midnight")} className={clsx("flex items-center gap-3 rounded-xl border p-3 text-xs font-medium", darkPalette === "midnight" ? "dashboard-brand-choice-active" : "dashboard-brand-choice")}><span className="flex gap-1"><i className="h-5 w-5 rounded-full bg-[#101018]" /><i className="h-5 w-5 rounded-full bg-[#a78bfa]" /></span>Midnight & violet {darkPalette === "midnight" && <span className="ml-auto">✓</span>}</button></div><h3 className="mb-2 text-xs font-semibold">Brand accent</h3><div className="grid grid-cols-2 gap-3">{[{name:"Green",color:"#16a34a"},{name:"Emerald",color:"#059669"},{name:"Orange",color:"#f97316"},{name:"Teal",color:"#0d9488"},{name:"Blue",color:"#2563eb"},{name:"Violet",color:"#7c3aed"}].map((brand) => <button key={brand.color} onClick={() => changeBrand(brand.color)} className={clsx("flex items-center gap-2 rounded-xl border p-3 text-xs font-medium", brandColor === brand.color ? "dashboard-brand-choice-active" : "dashboard-brand-choice")}><span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: brand.color }} />{brand.name}{brandColor === brand.color && <span className="ml-auto">✓</span>}</button>)}</div><div className="mt-6 border-t pt-5 dashboard-brand-panel-divider"><label htmlFor="custom-brand-color" className="mb-2 block text-xs font-medium">Custom brand color</label><div className="flex items-center gap-3"><input id="custom-brand-color" type="color" value={brandColor} onChange={(event) => changeBrand(event.target.value)} className="h-10 w-12 cursor-pointer rounded border p-1" /><span className="text-xs dashboard-muted">{brandColor.toUpperCase()}</span></div><button onClick={() => changeBrand("#16a34a")} className="dashboard-brand-reset mt-5 w-full rounded-xl px-3 py-2.5 text-xs font-semibold">Reset to green</button></div></aside></>}
  </div>;
}
