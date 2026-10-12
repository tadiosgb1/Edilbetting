"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity, CalendarDays, ChevronDown, CircleHelp, Clock3, Flame, Menu,
  Search, ShieldCheck, Trophy, Wallet, X, Zap,
} from "lucide-react";

type Match = {
  id: string;
  league: string;
  icon: string;
  home: string;
  away: string;
  kickoff: string;
  date: string;
  odds: [string, string, string];
  live?: boolean;
  score?: string;
};

const matches: Match[] = [
  { id: "m1", league: "ENGLISH PREMIER LEAGUE", icon: "🏴", home: "Arsenal", away: "Liverpool", kickoff: "20:00", date: "Today", odds: ["2.15", "3.40", "3.10"] },
  { id: "m2", league: "UEFA CHAMPIONS LEAGUE", icon: "🏆", home: "Real Madrid", away: "Bayern Munich", kickoff: "22:00", date: "Today", odds: ["2.35", "3.25", "2.85"] },
  { id: "m3", league: "SERIE A", icon: "🇮🇹", home: "Inter Milan", away: "AC Milan", kickoff: "19:45", date: "Tomorrow", odds: ["1.95", "3.55", "3.80"] },
  { id: "m4", league: "LA LIGA", icon: "🇪🇸", home: "Barcelona", away: "Atlético Madrid", kickoff: "21:00", date: "Tomorrow", odds: ["1.88", "3.60", "3.95"] },
  { id: "m5", league: "BUNDESLIGA", icon: "🇩🇪", home: "Dortmund", away: "Leverkusen", kickoff: "18:30", date: "Wed, Oct 14", odds: ["2.60", "3.45", "2.50"] },
  { id: "m6", league: "LIVE · INTERNATIONAL FRIENDLY", icon: "🌍", home: "Portugal", away: "Spain", kickoff: "62′", date: "Live now", odds: ["2.05", "2.90", "3.30"], live: true, score: "1 — 0" },
];

const topLeagues = [
  ["🏴", "Premier League", "12"],
  ["🏆", "Champions League", "8"],
  ["🇪🇸", "La Liga", "9"],
  ["🇮🇹", "Serie A", "10"],
  ["🇩🇪", "Bundesliga", "7"],
  ["🇫🇷", "Ligue 1", "6"],
];
const sports = [
  ["⚽", "Football", "42"],
  ["🏀", "Basketball", "18"],
  ["🎾", "Tennis", "14"],
  ["🏈", "American Football", "8"],
  ["🏒", "Ice Hockey", "11"],
  ["🏏", "Cricket", "5"],
];

type Pick = { matchId: string; teams: string; selection: string; odd: string };

export default function PlayerPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"home" | "sports" | "live">("home");
  const [day, setDay] = useState("All");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [activeLeague, setActiveLeague] = useState("All sports");

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
    <main className="min-h-screen bg-slate-950 pb-16 font-sans text-slate-100 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 shadow-lg">
        <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button aria-label="Toggle sports menu" onClick={() => setMobileMenu(!mobileMenu)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden">
              {mobileMenu ? <X size={19} /> : <Menu size={19} />}
            </button>
            <Link href="/player" className="flex shrink-0 items-center gap-1.5">
              <span className="rounded bg-amber-400 px-2 py-0.5 text-base font-black tracking-widest text-slate-950 sm:text-lg">EDIL</span>
              <span className="text-base font-black tracking-wide text-white sm:text-lg">BET</span>
            </Link>
            <nav className="ml-3 hidden items-center gap-1 lg:flex">
              {([{ id: "home", label: "⌂ Home" }, { id: "sports", label: "⚽ Sports" }, { id: "live", label: "🔴 Live" }] as const).map((item) => (
                <button key={item.id} onClick={() => { setTab(item.id); setDay(item.id === "live" ? "Live" : "All"); }} className={`rounded px-3 py-1.5 text-sm font-semibold transition ${tab === item.id ? "bg-amber-400/10 text-amber-400" : "text-slate-400 hover:bg-slate-800/70 hover:text-white"}`}>{item.label}</button>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <div className="hidden items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 sm:flex"><Wallet size={14} className="text-slate-400"/><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Balance</span><span className="text-xs font-black text-amber-400">— ETB</span></div>
            <Link href="/auth/login" className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white sm:px-3 sm:text-sm">Login</Link>
            <Link href="/auth/login" className="rounded-lg border border-amber-400/30 bg-amber-400 px-3 py-2 text-xs font-black text-slate-950 shadow-md shadow-amber-500/10 transition hover:bg-amber-300 sm:px-4 sm:text-sm">Register</Link>
          </div>
        </div>
        {mobileMenu && <div className="border-t border-slate-800 bg-slate-900 p-3 lg:hidden"><div className="grid grid-cols-3 gap-2">{(["home", "sports", "live"] as const).map((item) => <button key={item} onClick={() => { setTab(item); setDay(item === "live" ? "Live" : "All"); setMobileMenu(false); }} className={`rounded-lg px-3 py-2.5 text-sm font-bold capitalize ${tab === item ? "bg-amber-400/10 text-amber-400" : "text-slate-300 hover:bg-slate-800"}`}>{item}</button>)}</div></div>}
      </header>

      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="custom-scroll hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 lg:flex xl:w-64">
          <div className="border-b border-slate-800 p-3">
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search matches…" className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-8 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-amber-400"/>
            </div>
          </div>
          <div className="border-b border-slate-800 pb-2">
            <div className="flex items-center justify-between px-3 pb-1 pt-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top Leagues</p><Flame size={13} className="text-amber-400"/></div>
            {topLeagues.map(([icon, league, count]) => <button key={league} onClick={() => { setActiveLeague(league === "Premier League" ? "Premier League" : league === "Champions League" ? "Champions League" : league); setTab("sports"); setDay("All"); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-amber-300"><span className="text-sm">{icon}</span><span className="flex-1 truncate">{league}</span><span className="text-[9px] text-slate-600">{count}</span></button>)}
          </div>
          <div className="px-3 pb-1 pt-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sports</p></div>
          <div className="pb-4">{sports.map(([icon, name, count]) => <button key={name} onClick={() => { setActiveLeague(name === "Football" ? "All sports" : name); setTab("sports"); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-slate-300 transition hover:bg-slate-800/70 hover:text-white"><span className="text-base">{icon}</span><span className="flex-1 text-xs font-bold">{name}</span><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-500">{count}</span><ChevronDown size={12} className="text-slate-600"/></button>)}</div>
          <div className="mt-auto border-t border-slate-800 p-3"><div className="rounded-xl border border-amber-400/10 bg-amber-400/5 p-3"><div className="flex items-center gap-2 text-xs font-bold text-amber-300"><ShieldCheck size={14}/> Play responsibly</div><p className="mt-2 text-[10px] leading-4 text-slate-500">18+ only. Set limits and keep the game fun.</p></div></div>
        </aside>

        {mobileMenu && <button aria-label="Close menu overlay" onClick={() => setMobileMenu(false)} className="fixed inset-0 z-20 bg-black/60 lg:hidden"/>}

        <section className="min-w-0 flex-1 bg-slate-950">
          <div className="space-y-4 p-3 sm:p-4 xl:p-5">
            <div className="relative overflow-hidden rounded-xl border border-amber-400/15 bg-gradient-to-r from-amber-600 via-amber-800 to-slate-900 p-5 shadow-xl sm:p-6">
              <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-[28px] border-white/5"/>
              <div className="relative">
                <span className="mb-2 inline-flex rounded bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-100">⚽ Upcoming Football & Sports</span>
                <h1 className="max-w-2xl text-xl font-black leading-tight text-white sm:text-3xl">Bet on the matches coming next</h1>
                <p className="mt-2 max-w-xl text-xs leading-5 text-amber-100/90 sm:text-sm">Explore upcoming fixtures, compare match odds and follow the action in one place.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Home / {tab === "live" ? "Live" : tab === "sports" ? "Sports" : "Upcoming"}</p><h2 className="mt-1 text-sm font-black uppercase tracking-wide text-white">{tab === "live" ? "🔴 Live matches" : tab === "sports" ? "⚽ Sports & fixtures" : "📅 Upcoming Matches"}</h2></div>
              <div className="relative w-full sm:w-64 lg:hidden"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search matches…" className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs outline-none placeholder:text-slate-500 focus:border-amber-400"/></div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {([{label:"All",detail:"All events",value:"All"},{label:"Today",detail:"Today's matches",value:"Today"},{label:"Tomorrow",detail:"Next day",value:"Tomorrow"},{label:"Live",detail:"In play",value:"Live"}] as const).map((item) => <button key={item.value} onClick={() => { setDay(item.value); if (item.value === "Live") setTab("live"); else if (tab === "live") setTab("home"); }} className={`min-w-[104px] shrink-0 rounded-xl border px-4 py-2.5 text-left transition ${day === item.value ? "border-amber-400 bg-amber-400 text-slate-950" : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"}`}><span className="block text-[10px] font-black uppercase tracking-wider">{item.label}</span><span className="mt-0.5 block text-[9px] opacity-70">{item.detail}</span></button>)}
            </div>

            <div className="space-y-3">
              {visibleMatches.length === 0 && <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center"><Activity size={22} className="mx-auto text-slate-600"/><p className="mt-3 text-sm font-semibold text-slate-300">No matches found</p><p className="mt-1 text-xs text-slate-500">Try another search or date filter.</p><button onClick={() => { setSearch(""); setDay("All"); setTab("home"); setActiveLeague("All sports"); }} className="mt-4 text-xs font-bold text-amber-400">Clear filters</button></div>}
              {visibleMatches.map((match) => <article key={match.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-2.5 sm:px-4"><div className="flex min-w-0 items-center gap-2"><span>{match.icon}</span><span className="truncate text-[10px] font-black tracking-wide text-slate-400">{match.league}</span>{match.live && <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-black text-red-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"/>LIVE</span>}</div><div className="flex items-center gap-1.5 text-[10px] text-slate-500"><Clock3 size={12}/>{match.live ? match.kickoff : `${match.date} · ${match.kickoff}`}</div></div>
                <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(230px,.8fr)] sm:items-center sm:px-4 sm:py-4">
                  <div className="flex items-center justify-between gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{match.home}</p><p className="mt-2 truncate text-sm font-bold text-white">{match.away}</p></div>{match.score && <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-black text-amber-400">{match.score}</div>}<div className="hidden text-[10px] font-bold text-slate-600 sm:block">VS</div></div>
                  <div className="grid grid-cols-3 gap-2">{match.odds.map((odd, index) => { const selection = ["1", "X", "2"][index]; const active = picks.some((pick) => pick.matchId === match.id && pick.selection === selection); return <button key={selection} onClick={() => togglePick(match, index)} className={`rounded-lg border px-2 py-2 text-center transition ${active ? "border-amber-400 bg-amber-400/15" : "border-slate-700 bg-slate-800/80 hover:border-amber-400/50 hover:bg-slate-800"}`}><span className="block text-[9px] font-bold text-slate-500">{selection}</span><span className={`mt-1 block text-xs font-black ${active ? "text-amber-300" : "text-slate-200"}`}>{odd}</span></button>; })}</div>
                </div>
              </article>)}
            </div>
            <p className="text-[10px] leading-5 text-slate-600">Fixtures and odds shown here are illustrative preview data. No wagers are placed.</p>
          </div>
        </section>

        <aside className="hidden w-[280px] shrink-0 border-l border-slate-800 bg-slate-900 xl:block">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4"><div className="flex items-center gap-2"><Trophy size={16} className="text-amber-400"/><h2 className="text-xs font-black uppercase tracking-wide">Bet Slip</h2></div><span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{picks.length}</span></div>
          <div className="space-y-3 p-3">
            {picks.length === 0 ? <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-800"><Trophy size={17} className="text-slate-500"/></div><p className="mt-3 text-xs font-bold text-slate-300">Your slip is empty</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Choose odds from a match to add a selection.</p></div> : picks.map((pick) => <div key={pick.matchId} className="rounded-xl border border-slate-700 bg-slate-800/70 p-3"><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-semibold leading-5">{pick.teams}</p><button aria-label="Remove selection" onClick={() => setPicks((current) => current.filter((item) => item.matchId !== pick.matchId))} className="text-slate-500 hover:text-white"><X size={13}/></button></div><div className="mt-3 flex items-center justify-between text-[10px]"><span className="text-slate-400">Selection {pick.selection}</span><span className="font-black text-amber-300">{pick.odd}</span></div></div>)}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Combined odds</span><strong className="text-amber-300">{picks.length ? picks.reduce((total, pick) => total * Number(pick.odd), 1).toFixed(2) : "—"}</strong></div><Link href="/auth/login" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-3 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-300">Continue to sign in <Wallet size={14}/></Link><p className="mt-3 text-center text-[9px] leading-4 text-slate-600">Demo only. Sign in to continue.</p></div>
            <div className="flex items-start gap-2 rounded-lg bg-slate-800/60 p-3 text-[10px] leading-4 text-slate-500"><CircleHelp size={14} className="mt-0.5 shrink-0"/>Select a price to add it to your slip. A selection can be removed at any time.</div>
          </div>
        </aside>
      </div>
      <footer className="border-t border-slate-800 bg-slate-900 px-4 py-4 text-center text-[10px] text-slate-600">EdilBet · Play responsibly · 18+ only</footer>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-slate-800 bg-slate-900/95 backdrop-blur lg:hidden">{([{id:"home",label:"Home",icon:<CalendarDays size={16}/>},{id:"sports",label:"Sports",icon:<Trophy size={16}/>},{id:"live",label:"Live",icon:<Zap size={16}/>} ] as const).map((item) => <button key={item.id} onClick={() => { setTab(item.id); setDay(item.id === "live" ? "Live" : "All"); }} className={`flex flex-col items-center gap-1 py-2 text-[10px] font-bold ${tab === item.id ? "text-amber-400" : "text-slate-500"}`}>{item.icon}{item.label}</button>)}</nav>
    </main>
  );
}
