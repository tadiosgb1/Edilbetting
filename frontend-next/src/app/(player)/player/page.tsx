"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hashPassword, normalizePhone, useAuthStore } from "@/stores/auth-store";
import AuthPage from "@/components/auth/auth-page";
import { LanguageSelector, useLanguage } from "@/components/language-provider";
import {
  Activity, ArrowDownToLine, ArrowUpFromLine, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Dribbble,
  Flame, Gift, Globe, History, LockKeyhole, LogOut, Mail, Menu, Moon, Palette, Search, Settings, Shield, ShieldCheck, Snowflake,
  Sun, Target, Ticket, Trophy, UserRound, Users, Wallet, X, Zap, CircleDot,
} from "lucide-react";

type Match = {
  id: string;
  league: string;
  icon: "trophy" | "globe";
  home: string;
  away: string;
  kickoff: string;
  date: string;
  odds: [string, string, string];
  live?: boolean;
  score?: string;
};

const matches: Match[] = [
  { id: "m1", league: "ENGLISH PREMIER LEAGUE", icon: "trophy", home: "Arsenal", away: "Liverpool", kickoff: "20:00", date: "Today", odds: ["2.15", "3.40", "3.10"] },
  { id: "m2", league: "UEFA CHAMPIONS LEAGUE", icon: "trophy", home: "Real Madrid", away: "Bayern Munich", kickoff: "22:00", date: "Today", odds: ["2.35", "3.25", "2.85"] },
  { id: "m3", league: "SERIE A", icon: "trophy", home: "Inter Milan", away: "AC Milan", kickoff: "19:45", date: "Tomorrow", odds: ["1.95", "3.55", "3.80"] },
  { id: "m4", league: "LA LIGA", icon: "trophy", home: "Barcelona", away: "Atlético Madrid", kickoff: "21:00", date: "Tomorrow", odds: ["1.88", "3.60", "3.95"] },
  { id: "m5", league: "BUNDESLIGA", icon: "trophy", home: "Dortmund", away: "Leverkusen", kickoff: "18:30", date: "Wed, Oct 14", odds: ["2.60", "3.45", "2.50"] },
  { id: "m6", league: "LIVE · INTERNATIONAL FRIENDLY", icon: "globe", home: "Portugal", away: "Spain", kickoff: "62′", date: "Live now", odds: ["2.05", "2.90", "3.30"], live: true, score: "1 — 0" },
];

const topLeagues = [
  ["Premier League", "12"], ["Champions League", "8"], ["La Liga", "9"],
  ["Serie A", "10"], ["Bundesliga", "7"], ["Ligue 1", "6"],
];
const sports = [
  ["Football", "42"], ["Basketball", "18"], ["Tennis", "14"],
  ["American Football", "8"], ["Ice Hockey", "11"], ["Cricket", "5"],
];
const sportIcons = { Football: CircleDot, Basketball: Dribbble, Tennis: Target, "American Football": Shield, "Ice Hockey": Snowflake, Cricket: Trophy } as const;

type Pick = { matchId: string; teams: string; selection: string; odd: string };

export default function PlayerPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const accounts = useAuthStore((state) => state.accounts);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const [authHydrated, setAuthHydrated] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("500");
  const [depositMethod, setDepositMethod] = useState("Telebirr");
  const [depositPhone, setDepositPhone] = useState("");
  const [depositNotice, setDepositNotice] = useState("");
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentBusiness, setAgentBusiness] = useState("");
  const [agentLocation, setAgentLocation] = useState("");
  const [agentNotice, setAgentNotice] = useState("");
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [brandColor, setBrandColor] = useState("#16a34a");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [darkPalette, setDarkPalette] = useState<"coffee" | "slate" | "midnight" | "graphite" | "forest" | "navy" | "custom">("slate");
  const [darkSurfaceColor, setDarkSurfaceColor] = useState("#172033");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"home" | "sports" | "live">("home");
  const [day, setDay] = useState("All");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [activeLeague, setActiveLeague] = useState("All sports");
  const [oddsFormat, setOddsFormat] = useState("Decimal (2.20)");

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (persistApi.hasHydrated()) setAuthHydrated(true);
    const unsubscribe = persistApi.onFinishHydration(() => setAuthHydrated(true));
    if (window.localStorage.getItem("edilbet-player-theme") === "light") setTheme("light");
    const savedPalette = window.localStorage.getItem("edilbet-player-dark-palette");
    if (["coffee", "slate", "midnight", "graphite", "forest", "navy", "custom"].includes(savedPalette || "")) setDarkPalette(savedPalette as "coffee" | "slate" | "midnight" | "graphite" | "forest" | "navy" | "custom");
    const savedSurface = window.localStorage.getItem("edilbet-player-dark-surface");
    if (savedSurface && /^#[0-9a-fA-F]{6}$/.test(savedSurface)) setDarkSurfaceColor(savedSurface);
    try {
      const savedPreferences = JSON.parse(window.localStorage.getItem("edilbet-player-preferences") || "{}");
      if (typeof savedPreferences.oddsFormat === "string") setOddsFormat(savedPreferences.oddsFormat);
    } catch { /* use decimal odds by default */ }
    const savedBrand = window.localStorage.getItem("edilbet-player-brand");
    if (savedBrand && /^#[0-9a-fA-F]{6}$/.test(savedBrand)) setBrandColor(savedBrand);
    return unsubscribe;
  }, []);

  function changeBrand(color: string) {
    setBrandColor(color);
    window.localStorage.setItem("edilbet-player-brand", color);
  }

  function changeDarkPalette(palette: "coffee" | "slate" | "midnight" | "graphite" | "forest" | "navy" | "custom") {
    setDarkPalette(palette);
    window.localStorage.setItem("edilbet-player-dark-palette", palette);
  }

  function changeDarkSurface(color: string) {
    setDarkSurfaceColor(color);
    window.localStorage.setItem("edilbet-player-dark-surface", color);
    changeDarkPalette("custom");
  }

  function signOut() {
    clearUser();
    setAppearanceOpen(false);
    router.replace("/player");
  }

  async function submitPasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordNotice("");
    if (newPassword.length < 4) {
      setPasswordError("Use at least 4 characters for the new password.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }
    if (!user) return;
    const account = accounts.find((item) => normalizePhone(item.phone) === normalizePhone(user.phone) && item.role === user.role);
    if (!account) {
      setPasswordError("Password changes are available for accounts created in this app.");
      return;
    }
    if (await hashPassword(currentPassword) !== account.passwordHash) {
      setPasswordError("Current password is incorrect.");
      return;
    }
    const changed = await updatePassword(user.phone, user.role, await hashPassword(newPassword), user.name);
    if (!changed) {
      setPasswordError("Unable to update password. Please try again.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordNotice("Password updated.");
  }

  const visibleMatches = useMemo(() => matches.filter((match) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [match.league, match.home, match.away].some((value) => value.toLowerCase().includes(term));
    const matchesDay = day === "All" || match.date === day || (day === "Live" && match.live);
    const matchesTab = tab !== "live" || match.live;
    const matchesLeague = activeLeague === "All sports" || match.league.toLowerCase().includes(activeLeague.toLowerCase());
    return matchesSearch && matchesDay && matchesTab && matchesLeague;
  }), [search, day, tab, activeLeague]);

  function formatOdd(raw: string) {
    const decimal = Number(raw);
    if (!Number.isFinite(decimal) || decimal <= 1) return raw;
    if (oddsFormat.startsWith("US")) return decimal >= 2 ? `+${Math.round((decimal - 1) * 100)}` : `-${Math.round(100 / (decimal - 1))}`;
    if (oddsFormat.startsWith("Hong Kong")) return (decimal - 1).toFixed(2);
    if (oddsFormat.startsWith("Indonesian")) return decimal >= 2 ? `+${(decimal - 1).toFixed(2)}` : `-${(1 / (decimal - 1)).toFixed(2)}`;
    if (oddsFormat.startsWith("Malaysian")) return decimal >= 2 ? `+${(decimal - 1).toFixed(2)}` : `-${(1 / (decimal - 1)).toFixed(3)}`;
    if (oddsFormat.startsWith("UK")) {
      const value = decimal - 1;
      const denominators = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20, 25, 50, 100];
      let best = { n: 1, d: 1, error: Math.abs(value - 1) };
      for (const d of denominators) { const n = Math.max(1, Math.round(value * d)); const error = Math.abs(value - n / d); if (error < best.error) best = { n, d, error }; }
      return `${best.n}/${best.d}`;
    }
    return decimal.toFixed(2);
  }

  function togglePick(match: Match, index: number) {
    const selection = ["1", "X", "2"][index];
    const key = `${match.id}-${selection}`;
    setPicks((current) => current.some((pick) => `${pick.matchId}-${pick.selection}` === key)
      ? current.filter((pick) => `${pick.matchId}-${pick.selection}` !== key)
      : [...current.filter((pick) => pick.matchId !== match.id), { matchId: match.id, teams: `${match.home} vs ${match.away}`, selection, odd: match.odds[index] }]);
  }

  return (
    <main style={{ "--player-brand": brandColor, "--player-custom-surface": darkSurfaceColor } as React.CSSProperties} data-player-theme={theme} data-player-palette={darkPalette} className="player-root min-h-screen bg-slate-950 pb-16 font-sans text-slate-100 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900">
        <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button aria-label="Toggle sports menu" onClick={() => setMobileMenu(!mobileMenu)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--player-brand)] hover:bg-slate-800 lg:hidden">
              {mobileMenu ? <X size={19} className="player-accent-icon" /> : <Menu size={19} className="player-accent-icon" />}
            </button>
            <Link href="/player" className="flex shrink-0 items-center gap-1.5">
              <span style={{ backgroundColor: brandColor }} className="rounded px-2 py-0.5 text-base font-black tracking-widest text-slate-950 sm:text-lg">EDIL</span>
              <span className="text-base font-black tracking-wide text-white sm:text-lg">BET</span>
            </Link>
            <nav className="ml-3 hidden items-center gap-1 lg:flex">
              {([{ id: "home", label: t("Home") }, { id: "sports", label: t("Sports") }, { id: "live", label: t("Live") }] as const).map((item) => (
                <button key={item.id} onClick={() => { setTab(item.id); setDay(item.id === "live" ? "Live" : "All"); }} className={`rounded px-3 py-1.5 text-sm font-semibold transition ${tab === item.id ? "bg-[var(--player-brand)]/10 text-[var(--player-brand)]" : "text-slate-400 hover:bg-slate-800/70 hover:text-white"}`}>{item.label}</button>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <div className="flex items-center gap-1">
              {authHydrated && user && <div className="mr-1 flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 py-1 pl-2 pr-1.5 sm:gap-2 sm:pl-3"><Wallet size={15} className="player-accent-icon shrink-0"/><div className="leading-tight"><span className="block text-[9px] font-semibold text-slate-300">Wallet balance</span><strong className="block whitespace-nowrap text-[11px] font-bold text-white sm:text-xs">ETB 0.00</strong></div><button onClick={() => { setDepositNotice(""); setDepositOpen(true); }} className="ml-1 rounded-md px-2 py-1.5 text-[10px] font-bold text-white transition-opacity hover:opacity-90 sm:text-xs" style={{backgroundColor:brandColor}}>Deposit</button></div>}
              <LanguageSelector compact />
              {authHydrated && user ? <div className="relative">
                <button onClick={() => setProfileOpen((open) => !open)} aria-label="Open profile menu" aria-expanded={profileOpen} className="flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-2 text-sm transition hover:border-[var(--player-brand)]">
                  <UserRound size={17} className="player-accent-icon" />
                  <span className="hidden max-w-24 truncate text-xs font-semibold sm:block">{user.name}</span>
                  <ChevronDown size={13} className="player-accent-icon" />
                </button>
                {profileOpen && <>
                  <button aria-label="Close profile menu" onClick={() => setProfileOpen(false)} className="fixed inset-0 z-40 cursor-default" />
                  <div className="absolute right-0 top-11 z-50 max-h-[80vh] w-72 max-w-[90vw] overflow-y-auto border border-slate-700 bg-slate-900 p-1.5 shadow-2xl">
                    <div className="border-b border-slate-800 px-3 py-3"><p className="truncate text-xs font-semibold">{user.name}</p><p className="mt-0.5 text-[10px] uppercase text-slate-500">{user.role}</p><div className="mt-3 grid grid-cols-3 gap-2"><Link href="/player/account/bonus-points" onClick={() => setProfileOpen(false)} className="border border-slate-700 bg-slate-950 p-2"><Gift size={15} className="mb-1 text-[var(--player-brand)]"/><span className="block text-[10px] text-slate-400">Bonus points</span><strong className="text-xs">0</strong></Link><Link href="/player/account/main-account" onClick={() => setProfileOpen(false)} className="border border-slate-700 bg-slate-950 p-2"><Wallet size={15} className="mb-1 text-[var(--player-brand)]"/><span className="block text-[10px] text-slate-400">Main account</span><strong className="text-xs">ETB 0.00</strong></Link><Link href="/player/account/unsettled-bets" onClick={() => setProfileOpen(false)} className="border border-slate-700 bg-slate-950 p-2"><Ticket size={15} className="mb-1 text-[var(--player-brand)]"/><span className="block text-[10px] text-slate-400">Unsettled bets</span><strong className="text-xs">0</strong></Link></div></div>
                    {([{href:"deposit",label:"Make a deposit",icon:ArrowDownToLine},{href:"withdraw",label:"Withdraw funds",icon:ArrowUpFromLine},{href:"invite-friends",label:"Invite friends",icon:Users},{href:"profile",label:"Personal profile",icon:UserRound},{href:"bet-history",label:"Bet history",icon:History},{href:"settings",label:"Account settings",icon:Settings},{href:"messages",label:"Messages",icon:Mail}] as const).map((item) => { const ItemIcon = item.icon; return <Link key={item.href} href={`/player/account/${item.href}`} onClick={() => setProfileOpen(false)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-slate-800 hover:text-[var(--player-brand)]"><ItemIcon size={15} className="player-accent-icon"/>{item.label}<ChevronDown size={12} className="ml-auto -rotate-90 text-slate-600"/></Link>; })}
                    <button onClick={() => { setProfileOpen(false); setAppearanceOpen(true); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-[var(--player-brand)]"><Palette size={15} className="player-accent-icon" /> Brand appearance</button>
                    <button onClick={() => { setProfileOpen(false); setPasswordOpen(true); setPasswordError(""); setPasswordNotice(""); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-[var(--player-brand)]"><LockKeyhole size={15} className="player-accent-icon" /> Change password</button>
                    <button onClick={signOut} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-[var(--player-brand)]"><LogOut size={15} className="player-accent-icon" /> Log out</button>
                  </div>
                </>}
              </div> : authHydrated ? <>
                <button onClick={() => setAuthMode("login")} className="min-w-[76px] rounded-lg px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-[var(--player-brand)] sm:min-w-[92px] sm:px-5 sm:text-sm">Login</button>
                <button onClick={() => setAuthMode("register")} className="min-w-[88px] rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:min-w-[108px] sm:px-5 sm:text-sm" style={{ backgroundColor: brandColor }}>Register</button>
              </> : <span className="px-2 py-2 text-xs text-slate-500">…</span>}
              <button onClick={() => router.push("/player/account/settings")} aria-label="Account settings" aria-expanded={appearanceOpen} title="Account settings" className="grid h-9 w-9 place-items-center border border-slate-700 bg-slate-800/70 text-[var(--player-brand)] transition hover:bg-slate-800"><Settings size={16} className="player-accent-icon" /></button>
            </div>
          </div>
        </div>
        {mobileMenu && <div className="border-t border-slate-800 bg-slate-900 p-3 lg:hidden"><div className="grid grid-cols-3 gap-2">{(["home", "sports", "live"] as const).map((item) => <button key={item} onClick={() => { setTab(item); setDay(item === "live" ? "Live" : "All"); setMobileMenu(false); }} className={`rounded-lg px-3 py-2.5 text-sm font-bold capitalize ${tab === item ? "bg-[var(--player-brand)]/10 text-[var(--player-brand)]" : "text-slate-300 hover:bg-slate-800"}`}>{item}</button>)}</div></div>}
      </header>

      {appearanceOpen && <>
        <button aria-label="Close brand settings" onClick={() => setAppearanceOpen(false)} className="fixed inset-0 z-40 bg-black/30" />
        <aside aria-label="Player brand appearance settings" className="player-brand-panel fixed inset-y-0 right-0 z-50 w-[340px] max-w-[90vw] overflow-y-auto overscroll-contain border-l p-5">
          <div className="mb-6 flex items-center justify-between"><h2 className="text-sm font-semibold">Brand appearance</h2><button onClick={() => setAppearanceOpen(false)} aria-label="Close brand settings" className="player-appearance-button rounded-lg border p-2"><X size={17} /></button></div>
          <p className="mb-5 text-xs leading-5 player-appearance-muted">Customize player theme and accent colors. Preferences are saved in this browser, separately from the admin dashboard.</p>
          <h3 className="mb-2 text-xs font-semibold">Appearance</h3>
          <div className="mb-5 grid grid-cols-2 gap-2">
            <button onClick={() => { setTheme("dark"); window.localStorage.setItem("edilbet-player-theme", "dark"); }} aria-pressed={theme === "dark"} className={`rounded-xl border p-3 text-xs font-medium ${theme === "dark" ? "player-choice-active" : "player-choice"}`}><Moon size={15} className="mb-2 inline" /> Dark mode</button>
            <button onClick={() => { setTheme("light"); window.localStorage.setItem("edilbet-player-theme", "light"); }} aria-pressed={theme === "light"} className={`rounded-xl border p-3 text-xs font-medium ${theme === "light" ? "player-choice-active" : "player-choice"}`}><Sun size={15} className="mb-2 inline" /> Light mode</button>
          </div>
          <h3 className="mb-2 text-xs font-semibold">Dark mode colors</h3>
          <div className="mb-5 grid grid-cols-1 gap-2">
            {([
              { id: "coffee", label: "Coffee & orange", surface: "#211812", accent: "#f97316" },
              { id: "slate", label: "Slate & blue", surface: "#172033", accent: "#60a5fa" },
              { id: "midnight", label: "Midnight & violet", surface: "#101018", accent: "#a78bfa" },
              { id: "graphite", label: "Graphite & silver", surface: "#17191d", accent: "#d1d5db" },
              { id: "forest", label: "Forest & jade", surface: "#10231d", accent: "#34d399" },
              { id: "navy", label: "Navy & sky", surface: "#101d32", accent: "#38bdf8" },
            ] as const).map((palette) => <button key={palette.id} onClick={() => changeDarkPalette(palette.id)} aria-pressed={darkPalette === palette.id} className={`flex items-center gap-3 rounded-xl border p-3 text-xs font-medium ${darkPalette === palette.id ? "player-choice-active" : "player-choice"}`}><span className="flex gap-1"><i className="h-5 w-5 rounded-full" style={{ backgroundColor: palette.surface }} /><i className="h-5 w-5 rounded-full" style={{ backgroundColor: palette.accent }} /></span>{palette.label}{darkPalette === palette.id && <Check size={15} className="ml-auto" />}</button>)}
          </div>
          <div className="mb-5 border-t pt-4 player-appearance-divider"><label htmlFor="player-custom-dark-surface" className="mb-2 block text-xs font-medium">Custom dark surface</label><div className="flex items-center gap-3"><input id="player-custom-dark-surface" type="color" value={darkSurfaceColor} onChange={(event) => changeDarkSurface(event.target.value)} className="h-10 w-12 cursor-pointer rounded border p-1" /><span className="text-xs player-appearance-muted">{darkSurfaceColor.toUpperCase()}</span></div></div>
          <h3 className="mb-2 text-xs font-semibold">Brand accent</h3>
          <div className="grid grid-cols-2 gap-3">{[{ name: "Green", color: "#16a34a" }, { name: "Emerald", color: "#059669" }, { name: "Orange", color: "#f97316" }, { name: "Teal", color: "#0d9488" }, { name: "Blue", color: "#2563eb" }, { name: "Violet", color: "#7c3aed" }].map((brand) => <button key={brand.color} onClick={() => changeBrand(brand.color)} aria-pressed={brandColor === brand.color} className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-medium ${brandColor === brand.color ? "player-choice-active" : "player-choice"}`}><span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: brand.color }} />{brand.name}{brandColor === brand.color && <Check size={15} className="ml-auto" />}</button>)}</div>
          <div className="mt-6 border-t pt-5 player-appearance-divider"><label htmlFor="player-custom-brand-color" className="mb-2 block text-xs font-medium">Custom brand color</label><div className="flex items-center gap-3"><input id="player-custom-brand-color" type="color" value={brandColor} onChange={(event) => changeBrand(event.target.value)} className="h-10 w-12 cursor-pointer rounded border p-1" /><span className="text-xs player-appearance-muted">{brandColor.toUpperCase()}</span></div><button onClick={() => changeBrand("#16a34a")} className="player-brand-reset mt-5 w-full rounded-xl px-3 py-2.5 text-xs font-semibold">Reset to green</button></div>
        </aside>
      </>}

      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="custom-scroll hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 lg:flex xl:w-64">
          <div className="border-b border-slate-800 p-3">
            <div className="relative">
              <Search size={15} className="player-accent-icon absolute left-2.5 top-1/2 -translate-y-1/2"/>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Search matches…")} className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-8 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[var(--player-brand)]"/>
            </div>
          </div>
          <div className="border-b border-slate-800 pb-2">
            <div className="flex items-center justify-between px-3 pb-1 pt-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top Leagues</p><Flame size={13} className="text-[var(--player-brand)]"/></div>
            {topLeagues.map(([league, count]) => <button key={league} onClick={() => { setActiveLeague(league); setTab("sports"); setDay("All"); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-[var(--player-brand)]"><Trophy size={14} className="player-accent-icon shrink-0" /><span className="flex-1 truncate">{league}</span><span className="player-count-badge grid h-5 min-w-5 place-items-center rounded-full border border-[var(--player-brand)]/50 bg-[var(--player-brand)] px-1 text-[9px] font-bold tabular-nums text-white">{count}</span></button>)}
          </div>
          <div className="px-3 pb-1 pt-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sports</p></div>
          <div className="pb-4">{sports.map(([name, count]) => { const SportIcon = sportIcons[name as keyof typeof sportIcons]; return <button key={name} onClick={() => { setActiveLeague(name === "Football" ? "All sports" : name); setTab("sports"); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-slate-300 transition hover:bg-slate-800/70 hover:text-white"><SportIcon size={16} className="player-accent-icon shrink-0" /><span className="flex-1 text-xs font-bold">{name}</span><span className="player-count-badge grid h-5 min-w-5 place-items-center rounded-full border border-[var(--player-brand)]/50 bg-[var(--player-brand)] px-1 text-[9px] font-semibold tabular-nums text-white">{count}</span><ChevronDown size={12} className="text-slate-600"/></button>; })}</div>
          <div className="mt-auto space-y-3 border-t border-slate-800 p-3"><button onClick={() => { setAgentNotice(""); setAgentOpen(true); }} className="w-full rounded-xl border border-[var(--player-brand)]/40 bg-[var(--player-brand)]/10 p-3 text-left transition hover:bg-[var(--player-brand)]/15"><span className="block text-xs font-bold text-white">Become an agent</span><span className="mt-1 block text-[10px] leading-4 text-slate-300">Apply to partner with EdilBet</span></button><div className="rounded-xl border border-[var(--player-brand)]/10 bg-[var(--player-brand)]/5 p-3"><div className="flex items-center gap-2 text-xs font-bold text-[var(--player-brand)]"><ShieldCheck size={14}/> Play responsibly</div><p className="mt-2 text-[10px] leading-4 text-slate-300">18+ only. Set limits and keep the game fun.</p></div></div>
        </aside>

        {mobileMenu && <button aria-label="Close menu overlay" onClick={() => setMobileMenu(false)} className="fixed inset-0 z-20 bg-black/60 lg:hidden"/>}

        <section className="min-w-0 flex-1 bg-slate-950">
          <div className="space-y-4 p-3 sm:p-4 xl:p-5">
            <div className="relative overflow-hidden rounded-xl border border-[var(--player-brand)]/15 bg-[var(--player-brand)] p-5 sm:p-6">
              <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-[28px] border-white/5"/>
              <div className="relative">
                <span className="mb-2 inline-flex items-center gap-2 rounded bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-100"><Trophy size={13} />Upcoming Football & Sports</span>
                <h1 className="max-w-2xl text-xl font-black leading-tight text-white sm:text-3xl">Bet on the matches coming next</h1>
                <p className="mt-2 max-w-xl text-xs leading-5 text-amber-100/90 sm:text-sm">Explore upcoming fixtures, compare match odds and follow the action in one place.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Home / {tab === "live" ? "Live" : tab === "sports" ? "Sports" : "Upcoming"}</p><h2 className="mt-1 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white">{tab === "live" ? <><Activity size={15} className="text-red-400" />Live matches</> : tab === "sports" ? <><Trophy size={15} />Sports & fixtures</> : <><CalendarDays size={15} />Upcoming Matches</>}</h2></div>
              <div className="relative w-full sm:w-64 lg:hidden"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search matches…" className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs outline-none placeholder:text-slate-500 focus:border-[var(--player-brand)]"/></div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {([{label:"All",detail:"All events",value:"All"},{label:"Today",detail:"Today's matches",value:"Today"},{label:"Tomorrow",detail:"Next day",value:"Tomorrow"},{label:"Live",detail:"In play",value:"Live"}] as const).map((item) => <button key={item.value} onClick={() => { setDay(item.value); if (item.value === "Live") setTab("live"); else if (tab === "live") setTab("home"); }} className={`min-w-[104px] shrink-0 rounded-xl border px-4 py-2.5 text-left transition ${day === item.value ? "border-[var(--player-brand)] bg-[var(--player-brand)] text-slate-950" : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"}`}><span className="block text-[10px] font-black uppercase tracking-wider">{item.label}</span><span className="mt-0.5 block text-[9px] opacity-70">{item.detail}</span></button>)}
            </div>

            <div className="space-y-3">
              {visibleMatches.length === 0 && <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center"><Activity size={22} className="mx-auto text-slate-600"/><p className="mt-3 text-sm font-semibold text-slate-300">{t("No matches found")}</p><p className="mt-1 text-xs text-slate-500">Try another search or date filter.</p><button onClick={() => { setSearch(""); setDay("All"); setTab("home"); setActiveLeague("All sports"); }} className="mt-4 text-xs font-bold text-[var(--player-brand)]">Clear filters</button></div>}
              {visibleMatches.map((match) => <article key={match.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-2.5 sm:px-4"><div className="flex min-w-0 items-center gap-2">{match.icon === "globe" ? <Globe size={14} className="shrink-0 text-slate-500" /> : <Trophy size={14} className="shrink-0 text-slate-500" />}<span className="truncate text-[10px] font-black tracking-wide text-slate-400">{match.league}</span>{match.live && <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-black text-red-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"/>LIVE</span>}</div><div className="flex items-center gap-1.5 text-[10px] text-slate-500"><Clock3 size={12}/>{match.live ? match.kickoff : `${match.date} · ${match.kickoff}`}</div></div>
                <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(230px,.8fr)] sm:items-center sm:px-4 sm:py-4">
                  <div className="flex items-center justify-between gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{match.home}</p><p className="mt-2 truncate text-sm font-bold text-white">{match.away}</p></div>{match.score && <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-black text-[var(--player-brand)]">{match.score}</div>}<div className="hidden text-[10px] font-bold text-slate-600 sm:block">VS</div></div>
                  <div className="grid grid-cols-3 gap-2">{match.odds.map((odd, index) => { const selection = ["1", "X", "2"][index]; const active = picks.some((pick) => pick.matchId === match.id && pick.selection === selection); return <button key={selection} onClick={() => togglePick(match, index)} className={`rounded-lg border px-2 py-2 text-center transition ${active ? "border-[var(--player-brand)] bg-[var(--player-brand)]/15" : "border-slate-700 bg-slate-800/80 hover:border-[var(--player-brand)]/50 hover:bg-slate-800"}`}><span className="block text-[9px] font-bold text-slate-500">{selection}</span><span className={`mt-1 block text-xs font-black ${active ? "text-[var(--player-brand)]" : "text-slate-200"}`}>{formatOdd(odd)}</span></button>; })}</div>
                </div>
              </article>)}
            </div>
            <p className="text-[10px] leading-5 text-slate-600">Fixtures and odds are for preview only. No wagers are placed.</p>
          </div>
        </section>

        <aside className="hidden w-[280px] shrink-0 border-l border-slate-800 bg-slate-900 xl:block">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4"><div className="flex items-center gap-2"><Trophy size={16} className="text-[var(--player-brand)]"/><h2 className="text-xs font-black uppercase tracking-wide">Bet Slip</h2></div><span className="player-count-badge grid h-6 min-w-6 place-items-center rounded-full border border-[var(--player-brand)]/50 bg-[var(--player-brand)] px-1.5 text-[10px] font-bold tabular-nums text-white">{picks.length}</span></div>
          <div className="space-y-3 p-3">
            {picks.length === 0 ? <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-800"><Trophy size={17} className="text-slate-500"/></div><p className="mt-3 text-xs font-bold text-slate-300">{t("Your slip is empty")}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Choose odds from a match to add a selection.</p></div> : picks.map((pick) => <div key={pick.matchId} className="rounded-xl border border-slate-700 bg-slate-800/70 p-3"><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-semibold leading-5">{pick.teams}</p><button aria-label="Remove selection" onClick={() => setPicks((current) => current.filter((item) => item.matchId !== pick.matchId))} className="text-slate-500 hover:text-white"><X size={13}/></button></div><div className="mt-3 flex items-center justify-between text-[10px]"><span className="text-slate-400">Selection {pick.selection}</span><span className="font-black text-[var(--player-brand)]">{pick.odd}</span></div></div>)}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Combined odds</span><strong className="text-[var(--player-brand)]">{picks.length ? picks.reduce((total, pick) => total * Number(pick.odd), 1).toFixed(2) : "—"}</strong></div>{user ? <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-xs font-semibold text-emerald-300"><Check size={14} className="mr-2 inline" />Signed in as {user.name}. Wagers are not submitted.</div> : <button onClick={() => setAuthMode("login")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: brandColor }}>{t("Continue to sign in")} <Wallet size={14}/></button>}<p className="mt-3 text-center text-[9px] leading-4 text-slate-600">{user ? "No wagers are placed." : "Sign in to continue."}</p></div>
            <div className="flex items-start gap-2 rounded-lg bg-slate-800/60 p-3 text-[10px] leading-4 text-slate-500"><CircleHelp size={14} className="mt-0.5 shrink-0"/>Select a price to add it to your slip. A selection can be removed at any time.</div>
          </div>
        </aside>
      </div>
      {depositOpen && <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDepositOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-label="Deposit funds" className="relative my-auto w-full max-w-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl sm:p-7">
          <button onClick={() => setDepositOpen(false)} aria-label="Close deposit" className="absolute right-4 top-4 rounded-md p-2 text-slate-400 hover:bg-slate-800"><X size={18}/></button>
          <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full" style={{backgroundColor: brandColor}}><Wallet size={20} className="text-white"/></div><div><h2 className="text-xl font-bold">Deposit to wallet</h2><p className="mt-1 text-xs text-slate-300">Choose a payment method and enter your deposit details.</p></div></div>
          <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4"><p className="text-xs text-slate-300">Available balance</p><p className="mt-1 text-2xl font-black text-white">ETB 0.00</p></div>
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const request = { amount: Number(depositAmount), currency: "ETB", method: depositMethod, phone: depositPhone.trim(), createdAt: new Date().toISOString(), status: "pending" }; window.localStorage.setItem("edilbet-last-deposit-request", JSON.stringify(request)); setDepositNotice("Your deposit request details were saved in this browser. No payment was processed and your balance has not changed."); }}>
            <div><label htmlFor="deposit-amount" className="mb-1.5 block text-xs font-semibold text-slate-300">Amount (ETB)</label><input id="deposit-amount" type="number" min="50" max="100000" step="50" required value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-[var(--player-brand)]"/></div>
            <div><label htmlFor="deposit-method" className="mb-1.5 block text-xs font-semibold text-slate-300">Payment method</label><select id="deposit-method" value={depositMethod} onChange={(event) => setDepositMethod(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-[var(--player-brand)]"><option>Telebirr</option><option>CBE Birr</option><option>Bank transfer</option><option>Other payment provider</option></select></div>
            <div className="sm:col-span-2"><label htmlFor="deposit-phone" className="mb-1.5 block text-xs font-semibold text-slate-300">Payment account / phone number</label><input id="deposit-phone" type="tel" required value={depositPhone} onChange={(event) => setDepositPhone(event.target.value)} placeholder="Enter the account or phone used for payment" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-[var(--player-brand)]"/></div>
            <div className="sm:col-span-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">Payment processing is not connected yet. This saves a local request only; it does not transfer money or credit the wallet. A verified server-side payment integration is required before accepting real deposits.</div>
            {depositNotice && <p role="status" className="sm:col-span-2 rounded-lg bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-200">{depositNotice}</p>}
            <div className="flex gap-3 sm:col-span-2"><button type="button" onClick={() => setDepositOpen(false)} className="flex-1 rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Close</button><button type="submit" className="flex-1 rounded-lg px-4 py-3 text-sm font-bold text-white hover:opacity-90" style={{backgroundColor:brandColor}}>Save deposit request</button></div>
          </form>
        </section>
      </div>}
      {agentOpen && <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setAgentOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-label="Become an agent" className="relative my-auto w-full max-w-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl sm:p-7">
          <button onClick={() => setAgentOpen(false)} aria-label="Close agent application" className="absolute right-4 top-4 rounded-md p-2 text-slate-400 hover:bg-slate-800"><X size={18}/></button>
          <h2 className="text-xl font-bold">Become an EdilBet agent</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">Tell us about your business and location to start an agent partnership application.</p>
          <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); window.localStorage.setItem("edilbet-agent-application", JSON.stringify({ business: agentBusiness.trim(), location: agentLocation.trim(), applicant: user?.name || "", phone: user?.phone || "", createdAt: new Date().toISOString(), status: "pending" })); setAgentNotice("Application details saved in this browser only. A server-side application and review workflow still needs to be connected."); }}>
            <div><label htmlFor="agent-business" className="mb-1.5 block text-xs font-semibold text-slate-300">Business / applicant name</label><input id="agent-business" required value={agentBusiness} onChange={(event) => setAgentBusiness(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-[var(--player-brand)]" placeholder="Business or full name"/></div>
            <div><label htmlFor="agent-location" className="mb-1.5 block text-xs font-semibold text-slate-300">City / operating location</label><input id="agent-location" required value={agentLocation} onChange={(event) => setAgentLocation(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-[var(--player-brand)]" placeholder="City and area"/></div>
            <p className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-300">Agent onboarding, identity checks, commission rules, and approval need to be handled by the server and operations team.</p>
            {agentNotice && <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-200">{agentNotice}</p>}
            <div className="flex gap-3"><button type="button" onClick={() => setAgentOpen(false)} className="flex-1 rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-800">Close</button><button type="submit" className="flex-1 rounded-lg px-4 py-3 text-sm font-bold text-white hover:opacity-90" style={{backgroundColor:brandColor}}>Save application</button></div>
          </form>
        </section>
      </div>}
      {passwordOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setPasswordOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-label="Change password" className="relative w-full max-w-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 sm:p-7">
          <button onClick={() => setPasswordOpen(false)} aria-label="Close change password" className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 hover:bg-slate-800"><X size={18}/></button>
          <h2 className="text-lg font-semibold">Change password</h2>
          <form onSubmit={submitPasswordChange} className="mt-5 space-y-3">
            <div><label htmlFor="current-password" className="mb-1.5 block text-xs text-slate-300">Current password</label><input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-[var(--player-brand)]"/></div>
            <div><label htmlFor="new-password" className="mb-1.5 block text-xs text-slate-300">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={4} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-[var(--player-brand)]"/></div>
            <div><label htmlFor="confirm-new-password" className="mb-1.5 block text-xs text-slate-300">Confirm new password</label><input id="confirm-new-password" type="password" autoComplete="new-password" minLength={4} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-[var(--player-brand)]"/></div>
            {passwordError && <p role="alert" className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">{passwordError}</p>}
            {passwordNotice && <p role="status" className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{passwordNotice}</p>}
            <button type="submit" className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: brandColor }}>Update password</button>
          </form>
        </section>
      </div>}
      {authMode && <AuthPage key={authMode} mode={authMode} role="player" presentation="modal" onClose={() => setAuthMode(null)} onSuccess={() => setAuthMode(null)} />}
      <footer className="border-t border-slate-800 bg-slate-900 px-4 py-4 text-center text-[10px] text-slate-600">EdilBet · Play responsibly · 18+ only</footer>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-slate-800 bg-slate-900/95 backdrop-blur lg:hidden">{([{id:"home",label:"Home",icon:<CalendarDays size={16}/>},{id:"sports",label:"Sports",icon:<Trophy size={16}/>},{id:"live",label:"Live",icon:<Zap size={16}/>} ] as const).map((item) => <button key={item.id} onClick={() => { setTab(item.id); setDay(item.id === "live" ? "Live" : "All"); }} className={`flex flex-col items-center gap-1 py-2 text-[10px] font-bold ${tab === item.id ? "text-[var(--player-brand)]" : "text-slate-500"}`}>{item.icon}{item.label}</button>)}</nav>
    </main>
  );
}
