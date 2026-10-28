"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { LanguageSelector, useLanguage } from "@/components/language-provider";
import {
  Activity, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Dribbble,
  Flame, Globe, LogOut, Menu, Moon, Palette, Search, Shield, ShieldCheck, Snowflake,
  Sun, Target, Trophy, UserRound, Wallet, X, Zap, CircleDot,
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
const brandChoices = ["#fbbf24", "#22c55e", "#38bdf8", "#f472b6", "#a78bfa"];

type Pick = { matchId: string; teams: string; selection: string; odd: string };

export default function PlayerPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [authHydrated, setAuthHydrated] = useState(false);
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

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (persistApi.hasHydrated()) setAuthHydrated(true);
    const unsubscribe = persistApi.onFinishHydration(() => setAuthHydrated(true));
    if (window.localStorage.getItem("edilbet-player-theme") === "light") setTheme("light");
    const savedPalette = window.localStorage.getItem("edilbet-player-dark-palette");
    if (["coffee", "slate", "midnight", "graphite", "forest", "navy", "custom"].includes(savedPalette || "")) setDarkPalette(savedPalette as "coffee" | "slate" | "midnight" | "graphite" | "forest" | "navy" | "custom");
    const savedSurface = window.localStorage.getItem("edilbet-player-dark-surface");
    if (savedSurface && /^#[0-9a-fA-F]{6}$/.test(savedSurface)) setDarkSurfaceColor(savedSurface);
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

  const visibleMatches = useMemo(() => matches.filter((match) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [match.league, match.home, match.away].some((value) => value.toLowerCase().includes(term));
    const matchesDay = day === "All" || match.date === day || (day === "Live" && match.live);
    const matchesTab = tab !== "live" || match.live;
    const matchesLeague = activeLeague === "All sports" || match.league.toLowerCase().includes(activeLeague.toLowerCase());
    return matchesSearch && matchesDay && matchesTab && matchesLeague;
  }), [search, day, tab, activeLeague]);

  function togglePick(match: Match, index: number) {
    const selection = ["1", "X", "2"][index];
    const key = `${match.id}-${selection}`;
    setPicks((current) => current.some((pick) => `${pick.matchId}-${pick.selection}` === key)
      ? current.filter((pick) => `${pick.matchId}-${pick.selection}` !== key)
      : [...current.filter((pick) => pick.matchId !== match.id), { matchId: match.id, teams: `${match.home} vs ${match.away}`, selection, odd: match.odds[index] }]);
  }

  return (
    <main style={{ "--player-brand": brandColor, "--player-custom-surface": darkSurfaceColor } as React.CSSProperties} data-player-theme={theme} data-player-palette={darkPalette} className="player-root min-h-screen bg-slate-950 pb-16 font-sans text-slate-100 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 shadow-lg">
        <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button aria-label="Toggle sports menu" onClick={() => setMobileMenu(!mobileMenu)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden">
              {mobileMenu ? <X size={19} /> : <Menu size={19} />}
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
            {authHydrated && user ? <>
              <div className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 sm:flex"><UserRound size={15} className="text-slate-400" /><span className="max-w-28 truncate text-xs font-semibold text-slate-200">{user.name}</span><span className="rounded bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-300">{user.role}</span></div>
              <button onClick={signOut} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white sm:px-3 sm:text-sm"><LogOut size={14} /> Sign out</button>
            </> : authHydrated ? <>
              <Link href="/auth/login" className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white sm:px-3 sm:text-sm">Login</Link>
              <Link href="/auth/register" className="rounded-lg px-3 py-2 text-xs font-black text-slate-950 shadow-md transition hover:brightness-110 sm:px-4 sm:text-sm" style={{ backgroundColor: brandColor }}>Register</Link>
            </> : <span className="px-2 py-2 text-xs text-slate-500">Checking session…</span>}
            <button onClick={() => setAppearanceOpen((open) => !open)} aria-label="Brand appearance settings" aria-expanded={appearanceOpen} title="Brand appearance" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:text-white"><Palette size={16} /></button>
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-800 px-3 py-2 sm:px-5"><LanguageSelector compact /></div>
        {mobileMenu && <div className="border-t border-slate-800 bg-slate-900 p-3 lg:hidden"><div className="grid grid-cols-3 gap-2">{(["home", "sports", "live"] as const).map((item) => <button key={item} onClick={() => { setTab(item); setDay(item === "live" ? "Live" : "All"); setMobileMenu(false); }} className={`rounded-lg px-3 py-2.5 text-sm font-bold capitalize ${tab === item ? "bg-[var(--player-brand)]/10 text-[var(--player-brand)]" : "text-slate-300 hover:bg-slate-800"}`}>{item}</button>)}</div></div>}
      </header>

      {appearanceOpen && <>
        <button aria-label="Close brand settings" onClick={() => setAppearanceOpen(false)} className="fixed inset-0 z-40 bg-black/30" />
        <aside aria-label="Player brand appearance settings" className="player-brand-panel fixed inset-y-0 right-0 z-50 w-[340px] max-w-[90vw] overflow-y-auto overscroll-contain border-l p-5 shadow-2xl">
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
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Search matches…")} className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-8 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[var(--player-brand)]"/>
            </div>
          </div>
          <div className="border-b border-slate-800 pb-2">
            <div className="flex items-center justify-between px-3 pb-1 pt-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top Leagues</p><Flame size={13} className="text-[var(--player-brand)]"/></div>
            {topLeagues.map(([league, count]) => <button key={league} onClick={() => { setActiveLeague(league); setTab("sports"); setDay("All"); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-[var(--player-brand)]"><Trophy size={14} className="shrink-0 text-slate-500" /><span className="flex-1 truncate">{league}</span><span className="text-[9px] text-slate-600">{count}</span></button>)}
          </div>
          <div className="px-3 pb-1 pt-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sports</p></div>
          <div className="pb-4">{sports.map(([name, count]) => { const SportIcon = sportIcons[name as keyof typeof sportIcons]; return <button key={name} onClick={() => { setActiveLeague(name === "Football" ? "All sports" : name); setTab("sports"); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-slate-300 transition hover:bg-slate-800/70 hover:text-white"><SportIcon size={16} className="shrink-0 text-slate-500" /><span className="flex-1 text-xs font-bold">{name}</span><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-500">{count}</span><ChevronDown size={12} className="text-slate-600"/></button>; })}</div>
          <div className="mt-auto border-t border-slate-800 p-3"><div className="rounded-xl border border-[var(--player-brand)]/10 bg-[var(--player-brand)]/5 p-3"><div className="flex items-center gap-2 text-xs font-bold text-[var(--player-brand)]"><ShieldCheck size={14}/> Play responsibly</div><p className="mt-2 text-[10px] leading-4 text-slate-500">18+ only. Set limits and keep the game fun.</p></div></div>
        </aside>

        {mobileMenu && <button aria-label="Close menu overlay" onClick={() => setMobileMenu(false)} className="fixed inset-0 z-20 bg-black/60 lg:hidden"/>}

        <section className="min-w-0 flex-1 bg-slate-950">
          <div className="space-y-4 p-3 sm:p-4 xl:p-5">
            <div className="relative overflow-hidden rounded-xl border border-[var(--player-brand)]/15 bg-gradient-to-r from-[var(--player-brand)] via-[var(--player-brand)] to-slate-900 p-5 shadow-xl sm:p-6">
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
                  <div className="grid grid-cols-3 gap-2">{match.odds.map((odd, index) => { const selection = ["1", "X", "2"][index]; const active = picks.some((pick) => pick.matchId === match.id && pick.selection === selection); return <button key={selection} onClick={() => togglePick(match, index)} className={`rounded-lg border px-2 py-2 text-center transition ${active ? "border-[var(--player-brand)] bg-[var(--player-brand)]/15" : "border-slate-700 bg-slate-800/80 hover:border-[var(--player-brand)]/50 hover:bg-slate-800"}`}><span className="block text-[9px] font-bold text-slate-500">{selection}</span><span className={`mt-1 block text-xs font-black ${active ? "text-[var(--player-brand)]" : "text-slate-200"}`}>{odd}</span></button>; })}</div>
                </div>
              </article>)}
            </div>
            <p className="text-[10px] leading-5 text-slate-600">Fixtures and odds shown here are illustrative preview data. No wagers are placed.</p>
          </div>
        </section>

        <aside className="hidden w-[280px] shrink-0 border-l border-slate-800 bg-slate-900 xl:block">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4"><div className="flex items-center gap-2"><Trophy size={16} className="text-[var(--player-brand)]"/><h2 className="text-xs font-black uppercase tracking-wide">Bet Slip</h2></div><span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{picks.length}</span></div>
          <div className="space-y-3 p-3">
            {picks.length === 0 ? <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-800"><Trophy size={17} className="text-slate-500"/></div><p className="mt-3 text-xs font-bold text-slate-300">{t("Your slip is empty")}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Choose odds from a match to add a selection.</p></div> : picks.map((pick) => <div key={pick.matchId} className="rounded-xl border border-slate-700 bg-slate-800/70 p-3"><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-semibold leading-5">{pick.teams}</p><button aria-label="Remove selection" onClick={() => setPicks((current) => current.filter((item) => item.matchId !== pick.matchId))} className="text-slate-500 hover:text-white"><X size={13}/></button></div><div className="mt-3 flex items-center justify-between text-[10px]"><span className="text-slate-400">Selection {pick.selection}</span><span className="font-black text-[var(--player-brand)]">{pick.odd}</span></div></div>)}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Combined odds</span><strong className="text-[var(--player-brand)]">{picks.length ? picks.reduce((total, pick) => total * Number(pick.odd), 1).toFixed(2) : "—"}</strong></div>{user ? <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-xs font-semibold text-emerald-300"><Check size={14} className="mr-2 inline" />Signed in as {user.name}. This is a demo slip; wagers are not submitted.</div> : <Link href="/auth/login" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-black text-slate-950 transition hover:brightness-110" style={{ backgroundColor: brandColor }}>{t("Continue to sign in")} <Wallet size={14}/></Link>}<p className="mt-3 text-center text-[9px] leading-4 text-slate-600">{user ? "Demo only. No wagers are placed." : "Demo only. Sign in to continue."}</p></div>
            <div className="flex items-start gap-2 rounded-lg bg-slate-800/60 p-3 text-[10px] leading-4 text-slate-500"><CircleHelp size={14} className="mt-0.5 shrink-0"/>Select a price to add it to your slip. A selection can be removed at any time.</div>
          </div>
        </aside>
      </div>
      <footer className="border-t border-slate-800 bg-slate-900 px-4 py-4 text-center text-[10px] text-slate-600">EdilBet · Play responsibly · 18+ only</footer>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-slate-800 bg-slate-900/95 backdrop-blur lg:hidden">{([{id:"home",label:"Home",icon:<CalendarDays size={16}/>},{id:"sports",label:"Sports",icon:<Trophy size={16}/>},{id:"live",label:"Live",icon:<Zap size={16}/>} ] as const).map((item) => <button key={item.id} onClick={() => { setTab(item.id); setDay(item.id === "live" ? "Live" : "All"); }} className={`flex flex-col items-center gap-1 py-2 text-[10px] font-bold ${tab === item.id ? "text-[var(--player-brand)]" : "text-slate-500"}`}>{item.icon}{item.label}</button>)}</nav>
    </main>
  );
}
