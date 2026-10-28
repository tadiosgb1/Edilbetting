"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ChevronDown, Clock3, Search, Trophy } from "lucide-react";

type Option = { label: string; odd: string };
type Market = { name: string; options: Option[] };
type Category = { name: string; markets: Market[] };

const fixtures: Record<string, { home: string; away: string; league: string; date: string; kickoff: string; odds: string[] }> = {
  m1: { home: "Arsenal", away: "Liverpool", league: "ENGLISH PREMIER LEAGUE", date: "Today", kickoff: "20:00", odds: ["2.15", "3.40", "3.10"] },
  m2: { home: "Real Madrid", away: "Bayern Munich", league: "UEFA CHAMPIONS LEAGUE", date: "Today", kickoff: "22:00", odds: ["2.35", "3.25", "2.85"] },
  m3: { home: "Inter Milan", away: "AC Milan", league: "SERIE A", date: "Tomorrow", kickoff: "19:45", odds: ["1.95", "3.55", "3.80"] },
  m4: { home: "Barcelona", away: "Atlético Madrid", league: "LA LIGA", date: "Tomorrow", kickoff: "21:00", odds: ["1.88", "3.60", "3.95"] },
  m5: { home: "Dortmund", away: "Leverkusen", league: "BUNDESLIGA", date: "Wed, Oct 14", kickoff: "18:30", odds: ["2.60", "3.45", "2.50"] },
  m6: { home: "Portugal", away: "Spain", league: "INTERNATIONAL FRIENDLY", date: "Live now", kickoff: "62′", odds: ["2.05", "2.90", "3.30"] },
};

const makeOptions = (pairs: [string, string][]): Option[] => pairs.map(([label, odd]) => ({ label, odd }));
const categories: Category[] = [
  { name: "Match result & popular", markets: [
    { name: "Full-time result (1X2)", options: makeOptions([["1 · Home win","2.15"],["X · Draw","3.40"],["2 · Away win","3.10"]]) },
    { name: "Double chance", options: makeOptions([["1X · Home or draw","1.32"],["12 · Either team wins","1.28"],["X2 · Draw or away","1.66"]]) },
    { name: "Draw no bet", options: makeOptions([["Home","1.48"],["Draw · void","3.40"],["Away","2.35"]]) },
    { name: "To qualify", options: makeOptions([["Home to qualify","1.78"],["Away to qualify","2.02"]]) },
    { name: "Match winner incl. overtime", options: makeOptions([["Home","2.00"],["Away","2.75"]]) },
  ]},
  { name: "Goals", markets: [
    { name: "Total goals", options: makeOptions([["Over 0.5","1.08"],["Over 1.5","1.28"],["Over 2.5","1.92"],["Over 3.5","3.10"],["Over 4.5","5.50"],["Under 1.5","3.25"],["Under 2.5","1.88"],["Under 3.5","1.42"],["Under 4.5","1.18"]]) },
    { name: "Asian total goals", options: makeOptions([["Over 2.0","1.58"],["Under 2.0","2.32"],["Over 2.25","1.72"],["Under 2.25","2.08"],["Over 2.75","2.05"],["Under 2.75","1.72"],["Over 3.0","2.45"],["Under 3.0","1.52"]]) },
    { name: "Home team total goals", options: makeOptions([["Home over 0.5","1.22"],["Home over 1.5","1.78"],["Home over 2.5","3.25"],["Home under 0.5","3.90"],["Home under 1.5","2.05"],["Home under 2.5","1.30"]]) },
    { name: "Away team total goals", options: makeOptions([["Away over 0.5","1.34"],["Away over 1.5","2.10"],["Away over 2.5","4.20"],["Away under 0.5","2.95"],["Away under 1.5","1.68"],["Away under 2.5","1.20"]]) },
    { name: "Exact total goals", options: makeOptions([["0 goals","11.00"],["1 goal","4.20"],["2 goals","3.55"],["3 goals","4.10"],["4 goals","4.80"],["5+ goals","7.50"]]) },
    { name: "Goal range", options: makeOptions([["0–1 goals","3.10"],["2–3 goals","1.95"],["2–4 goals","1.72"],["4–6 goals","3.20"],["5+ goals","5.50"]]) },
    { name: "Odd / even total goals", options: makeOptions([["Odd","1.92"],["Even","1.88"]]) },
  ]},
  { name: "Both teams to score", markets: [
    { name: "Both teams to score", options: makeOptions([["Yes","1.82"],["No","1.94"]]) },
    { name: "BTTS & match result", options: makeOptions([["Yes + Home","3.60"],["Yes + Draw","4.10"],["Yes + Away","4.30"],["No + Home","3.20"],["No + Draw","6.50"],["No + Away","4.80"]]) },
    { name: "BTTS in each half", options: makeOptions([["Yes","8.50"],["No","1.04"]]) },
  ]},
  { name: "Half-time", markets: [
    { name: "Half-time result", options: makeOptions([["1 · Home","2.65"],["X · Draw","2.05"],["2 · Away","3.20"]]) },
    { name: "Half-time double chance", options: makeOptions([["1X","1.28"],["12","1.62"],["X2","1.40"]]) },
    { name: "First-half total goals", options: makeOptions([["Over 0.5","1.42"],["Over 1.5","2.75"],["Over 2.5","5.80"],["Under 0.5","2.55"],["Under 1.5","1.40"],["Under 2.5","1.10"]]) },
    { name: "Second-half total goals", options: makeOptions([["Over 0.5","1.35"],["Over 1.5","2.25"],["Over 2.5","4.80"],["Under 1.5","1.55"],["Under 2.5","1.18"]]) },
    { name: "Half-time / full-time", options: makeOptions([["1 / 1","3.50"],["1 / X","12.00"],["1 / 2","28.00"],["X / 1","5.50"],["X / X","4.80"],["X / 2","6.20"],["2 / 1","25.00"],["2 / X","13.00"],["2 / 2","4.60"]]) },
  ]},
  { name: "Handicaps", markets: [
    { name: "Asian handicap", options: makeOptions([["Home -1.5","3.40"],["Home -1","2.85"],["Home -0.5","2.15"],["Home +0.5","1.48"],["Home +1","1.30"],["Away -1","4.20"],["Away -0.5","3.10"],["Away +0.5","1.72"],["Away +1","1.42"],["Away +1.5","1.25"]]) },
    { name: "European handicap", options: makeOptions([["Home -1","3.40"],["Draw -1","3.75"],["Away +1","1.78"],["Home -2","6.50"],["Draw -2","6.00"],["Away +2","1.25"]]) },
    { name: "First-half handicap", options: makeOptions([["Home -1","5.50"],["Home +1","1.24"],["Away -1","6.20"],["Away +1","1.22"]]) },
  ]},
  { name: "Correct score & winning margin", markets: [
    { name: "Correct score", options: makeOptions([["0–0","9.50"],["1–0","7.50"],["2–0","9.00"],["2–1","8.00"],["3–0","14.00"],["3–1","12.00"],["0–1","10.00"],["0–2","13.00"],["1–2","11.00"],["1–1","6.50"],["2–2","12.00"],["3–2","21.00"],["Other home win","12.00"],["Other draw","20.00"],["Other away win","14.00"]]) },
    { name: "Winning margin", options: makeOptions([["Home by 1","3.60"],["Home by 2","5.20"],["Home by 3+","6.50"],["Draw","3.40"],["Away by 1","4.10"],["Away by 2","6.00"],["Away by 3+","8.50"]]) },
    { name: "Winning method", options: makeOptions([["Home win to nil","3.40"],["Away win to nil","4.80"],["Home win & BTTS","3.60"],["Away win & BTTS","4.30"]]) },
  ]},
  { name: "Corners", markets: [
    { name: "Total corners", options: makeOptions([["Over 7.5","1.42"],["Over 8.5","1.72"],["Over 9.5","2.05"],["Over 10.5","2.55"],["Over 11.5","3.30"],["Under 8.5","2.00"],["Under 9.5","1.70"],["Under 10.5","1.45"]]) },
    { name: "Corner handicap", options: makeOptions([["Home -1.5","1.90"],["Home +1.5","1.70"],["Away -1.5","2.10"],["Away +1.5","1.60"]]) },
    { name: "First corner", options: makeOptions([["Home","1.85"],["No corner","25.00"],["Away","2.05"]]) },
    { name: "Most corners", options: makeOptions([["Home","1.90"],["Equal","7.00"],["Away","2.10"]]) },
  ]},
  { name: "Cards & discipline", markets: [
    { name: "Total cards", options: makeOptions([["Over 2.5","1.55"],["Over 3.5","1.95"],["Over 4.5","2.65"],["Under 2.5","2.25"],["Under 3.5","1.75"],["Under 4.5","1.40"]]) },
    { name: "First card", options: makeOptions([["Home","2.10"],["No card","15.00"],["Away","2.20"]]) },
    { name: "Red card in match", options: makeOptions([["Yes","4.50"],["No","1.16"]]) },
  ]},
  { name: "Time of goals", markets: [
    { name: "First goal", options: makeOptions([["Home","1.85"],["No goals","11.00"],["Away","2.10"]]) },
    { name: "Last goal", options: makeOptions([["Home","1.85"],["No goals","11.00"],["Away","2.10"]]) },
    { name: "Goal in both halves", options: makeOptions([["Yes","1.72"],["No","2.00"]]) },
    { name: "Goal intervals", options: makeOptions([["1–15 min","3.80"],["16–30 min","4.20"],["31–45 min","4.00"],["46–60 min","4.10"],["61–75 min","4.00"],["76–90 min","3.60"]]) },
  ]},
  { name: "Players", markets: [
    { name: "Anytime goalscorer", options: makeOptions([["Player 1","2.40"],["Player 2","2.80"],["Player 3","3.20"],["Any other player","4.50"]]) },
    { name: "First goalscorer", options: makeOptions([["Player 1","5.00"],["Player 2","6.00"],["Player 3","7.00"],["No goalscorer","11.00"]]) },
    { name: "Player to be booked", options: makeOptions([["Player 1","3.20"],["Player 2","3.50"],["Player 3","4.00"]]) },
  ]},
  { name: "Specials & combinations", markets: [
    { name: "Result + total goals", options: makeOptions([["Home & over 1.5","2.65"],["Home & under 2.5","4.50"],["Draw & over 1.5","4.10"],["Away & over 1.5","3.50"],["Away & under 2.5","5.20"]]) },
    { name: "Clean sheet", options: makeOptions([["Home clean sheet","2.75"],["Away clean sheet","3.50"],["Either team clean sheet","1.72"],["No clean sheet","2.10"]]) },
    { name: "Win both halves", options: makeOptions([["Home","5.50"],["Away","7.00"],["Neither","1.12"]]) },
    { name: "Penalty awarded", options: makeOptions([["Yes","3.20"],["No","1.30"]]) },
    { name: "Own goal", options: makeOptions([["Yes","8.50"],["No","1.04"]]) },
  ]},
];

const categoriesNames = categories.map((category) => category.name);
export default function MatchMarketsPage() {
  const params = useParams<{ id: string }>();
  const match = fixtures[params.id] || fixtures.m1;
  const [activeCategory, setActiveCategory] = useState(categories[0].name);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [oddsFormat, setOddsFormat] = useState("Decimal");
  const [expanded, setExpanded] = useState<string | null>(null);
  const formatOdd = (raw: string) => {
    const value = Number(raw);
    if (oddsFormat === "US") return value >= 2 ? "+" + Math.round((value - 1) * 100) : "-" + Math.round(100 / (value - 1));
    if (oddsFormat === "Hong Kong") return (value - 1).toFixed(2);
    return value.toFixed(2);
  };
  const active = categories.find((category) => category.name === activeCategory) || categories[0];
  const filteredMarkets = active.markets.filter((market) => !search || (market.name + " " + market.options.map((option) => option.label).join(" ")).toLowerCase().includes(search.toLowerCase()));
  const totalMarkets = categories.reduce((sum, category) => sum + category.markets.length, 0);
  return <main className="min-h-screen bg-slate-950 text-slate-100">
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-3 px-3 sm:px-5">
        <Link href="/player" className="flex items-center gap-1.5"><span className="rounded bg-emerald-500 px-2 py-0.5 text-base font-black tracking-widest text-slate-950">EDIL</span><span className="text-base font-black tracking-wide text-white">BET</span></Link>
        <Link href="/player" className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-emerald-500 hover:text-white"><ArrowLeft size={14}/> Back to matches</Link>
      </div>
    </header>
    <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-5">
      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400"><Trophy size={13}/>{match.league}</p><h1 className="mt-2 text-lg font-black text-white sm:text-2xl">{match.home} <span className="text-slate-500">vs</span> {match.away}</h1><p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={13}/>{match.date} · {match.kickoff}</p></div><div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Markets available</p><p className="mt-1 text-xl font-black text-emerald-400">+{totalMarkets}</p></div></div>
        <div className="mt-4 grid grid-cols-3 gap-2">{match.odds.map((odd,index) => <button key={index} onClick={() => setSelected((current) => current.includes("1X2-"+index) ? current.filter((item) => item !== "1X2-"+index) : [...current,"1X2-"+index])} className={selected.includes("1X2-"+index) ? "rounded-lg border border-emerald-500 bg-emerald-500/15 p-2.5 text-center" : "rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-center hover:border-emerald-500/60"}><span className="block text-[10px] font-bold text-slate-400">{["1 · Home","X · Draw","2 · Away"][index]}</span><strong className="mt-1 block text-sm font-black text-white">{formatOdd(odd)}</strong></button>)}</div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border border-slate-800 bg-slate-900 p-2 lg:sticky lg:top-[76px]">
          <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Market categories</p>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">{categoriesNames.map((name) => <button key={name} onClick={() => setActiveCategory(name)} className={activeCategory === name ? "shrink-0 rounded-md bg-emerald-500 px-3 py-2.5 text-left text-xs font-bold text-slate-950" : "shrink-0 rounded-md px-3 py-2.5 text-left text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"}>{name}<span className="ml-2 opacity-70">{categories.find((category) => category.name === name)?.markets.length}</span></button>)}</nav>
        </aside>
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-black text-white">{active.name}</h2><p className="mt-1 text-[10px] text-slate-500">{active.markets.length} market groups · choose a price to highlight it</p></div><div className="flex items-center gap-2"><label className="sr-only" htmlFor="market-search">Search markets</label><div className="relative"><Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"/><input id="market-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a market…" className="w-44 rounded-md border border-slate-700 bg-slate-900 py-2 pl-8 pr-2 text-xs outline-none focus:border-emerald-500"/></div><select value={oddsFormat} onChange={(event) => setOddsFormat(event.target.value)} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-300"><option value="Decimal">Decimal</option><option value="US">US (+500)</option><option value="Hong Kong">Hong Kong</option></select></div></div>
          <div className="space-y-3">{filteredMarkets.map((market) => <article key={market.name} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"><button onClick={() => setExpanded(expanded === market.name ? null : market.name)} className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 text-left"><span className="text-xs font-extrabold text-slate-200">{market.name}<span className="ml-2 text-[10px] font-normal text-slate-500">{market.options.length} outcomes</span></span><ChevronDown size={14} className={expanded === market.name ? "rotate-180 text-emerald-400" : "text-slate-500"}/></button><div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 xl:grid-cols-4">{market.options.map((option) => {const key=market.name+"::"+option.label;const isSelected=selected.includes(key);return <button key={option.label} onClick={() => setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current,key])} className={isSelected ? "rounded-md border border-emerald-500 bg-emerald-500/15 px-3 py-2 text-left" : "rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-left transition hover:border-emerald-500/50 hover:bg-slate-800"}><span className="block text-[10px] leading-4 text-slate-400">{option.label}</span><strong className="mt-1 block text-xs font-black tabular-nums text-white">{formatOdd(option.odd)}</strong></button>;})}</div></article>)}</div>
          <p className="mt-4 text-[10px] leading-5 text-slate-600">This page contains illustrative market names and prices for UI preview. It is not connected to live sportsbook feeds, and selections are not submitted as wagers. Actual market availability varies by event and provider.</p>
        </section>
      </div>
    </div>
  </main>;
}
