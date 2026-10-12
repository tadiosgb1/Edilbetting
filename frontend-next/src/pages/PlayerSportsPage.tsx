import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { initialMarkets, sports, categories } from '../data/markets'
import type { Market, Pick } from '../types/sportsbook'
import SportsbookStat from '../components/SportsbookStat'
import { Activity, ArrowDownRight, ArrowUpRight, Bell, ChevronRight, CircleHelp, Clock3, Flame, Menu, Search, ShieldCheck, Ticket, Trophy, UserRound, Wallet, X, Zap } from 'lucide-react'

export default function PlayerSportsPage() {
  const [markets] = useState(initialMarkets)
  const [sport, setSport] = useState('All matches')
  const [activeNav, setActiveNav] = useState('Sports')
  const [search, setSearch] = useState('')
  const [picks, setPicks] = useState<Pick[]>([])
  const [stake, setStake] = useState('50')
  const [authOpen, setAuthOpen] = useState<'login' | 'register' | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem('token')))
  const navigate = useNavigate()
  const visibleMarkets = useMemo(() => markets.filter((m) => {
    const categoryMatch = sport === 'All matches' || (sport === 'Live' ? m.live : sport === 'Upcoming' ? !m.live : m.sport === sport)
    const navMatch = activeNav !== 'Live' || m.live
    const searchMatch = `${m.home} ${m.away} ${m.league}`.toLowerCase().includes(search.toLowerCase())
    return categoryMatch && navMatch && searchMatch
  }), [markets, sport, activeNav, search])
  const totalOdds = picks.reduce((total, p) => total * Number(p.odd), 1)
  const potentialReturn = picks.length ? Number(stake || 0) * totalOdds : 0
  const togglePick = (market: Market, selection: string, odd: string) => {
    if (odd === '—') return
    setPicks((current) => current.some((p) => p.market.id === market.id && p.selection === selection)
      ? current.filter((p) => !(p.market.id === market.id && p.selection === selection))
      : [...current.filter((p) => p.market.id !== market.id), { market, selection, odd }])
  }
  const submitAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice('Authentication API is not connected yet. Your existing Vue app remains unchanged.')
  }
  const navTo = (name: string) => { setActiveNav(name); setSport(name === 'Live' ? 'All matches' : 'All matches'); setMobileOpen(false) }

  return <div className="min-h-screen bg-edil-950 text-slate-100">
    <div className="border-b border-white/5 bg-[#0c1422]">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-2 text-[11px] text-slate-400 sm:px-6">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-edil-green" /> EDILBET SPORTSBOOK <span className="hidden sm:inline">· Your game, your odds</span></div>
        <div className="flex items-center gap-4"><span className="hidden sm:inline-flex items-center gap-1"><ShieldCheck size={13} /> Secure platform</span><button className="inline-flex items-center gap-1 hover:text-edil-green"><CircleHelp size={13}/> Help center</button><button className="inline-flex items-center gap-1 hover:text-edil-green"><Bell size={13}/> <span className="hidden sm:inline">Updates</span></button></div>
      </div>
    </div>
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#101827]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
        <button className="flex shrink-0 items-center gap-2" onClick={() => { navTo('Sports'); navigate('/') }} aria-label="EdilBet home"><span className="grid h-10 w-10 place-items-center rounded-xl bg-edil-green text-lg font-black italic text-slate-950 shadow-glow">E</span><span className="text-xl font-black tracking-tight">EDIL<span className="text-edil-green">BET</span><span className="ml-2 hidden rounded bg-white/5 px-1.5 py-1 align-middle text-[9px] font-bold tracking-[.2em] text-slate-400 sm:inline">SPORTS</span></span></button>
        <nav className="hidden items-center gap-1 md:flex">{['Sports', 'Live', 'Results', 'Promotions'].map((item) => <button key={item} onClick={() => navTo(item)} className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${activeNav === item ? 'bg-edil-green/10 text-edil-green' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{item === 'Live' && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500"/>}{item}</button>)}</nav>
        <div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2.5 text-sm text-slate-400 lg:flex"><Wallet size={16}/><span>Balance</span><strong className="text-white">{isLoggedIn ? '0.00 ETB' : '— ETB'}</strong></div>
          {isLoggedIn ? <button onClick={() => { localStorage.removeItem('token'); setIsLoggedIn(false) }} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold hover:border-edil-green">Log out</button> : <><button onClick={() => setAuthOpen('login')} className="hidden rounded-lg px-3 py-2.5 text-sm font-bold text-slate-300 hover:text-white sm:block">Log in</button><button onClick={() => setAuthOpen('register')} className="rounded-lg bg-edil-green px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-lime-300">Join now</button></>}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg border border-white/10 p-2 md:hidden" aria-label="Open menu">{mobileOpen ? <X size={19}/> : <Menu size={19}/>}</button>
        </div>
      </div>
      {mobileOpen && <div className="border-t border-white/10 p-3 md:hidden">{['Sports', 'Live', 'Results', 'Promotions'].map((n) => <button key={n} onClick={() => navTo(n)} className="block w-full rounded-lg px-4 py-3 text-left font-semibold hover:bg-white/5">{n}</button>)}</div>}
    </header>

    <main className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7">
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1d3040] via-[#142337] to-[#111827] px-5 py-7 sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full bg-edil-green/10 blur-3xl"/><div className="pointer-events-none absolute right-[18%] top-8 h-40 w-40 rounded-full border border-edil-green/10"/>
        <div className="relative max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-edil-green/25 bg-edil-green/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-edil-green"><Flame size={13}/> The action starts here</div><h1 className="max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">Every match. <span className="text-edil-green">Every moment.</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">Follow the action, explore the odds and make every game count with EdilBet.</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={() => { navTo('Sports'); document.getElementById('markets')?.scrollIntoView({ behavior: 'smooth' }) }} className="inline-flex items-center gap-2 rounded-xl bg-edil-green px-5 py-3 text-sm font-black text-slate-950 hover:bg-lime-300">Explore matches <ChevronRight size={16}/></button><button onClick={() => navTo('Live')} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold hover:bg-white/10"><Activity size={16}/> Live center</button></div></div>
        <div className="relative mt-7 grid max-w-xl grid-cols-3 gap-2 sm:absolute sm:bottom-8 sm:right-8 sm:mt-0 sm:w-[42%]"><div className="rounded-xl border border-white/10 bg-black/20 p-3"><Zap className="mb-2 text-edil-green" size={17}/><p className="text-lg font-black sm:text-2xl">LIVE</p><p className="text-[10px] text-slate-400 sm:text-xs">Match center</p></div><div className="rounded-xl border border-white/10 bg-black/20 p-3"><Trophy className="mb-2 text-edil-green" size={17}/><p className="text-lg font-black sm:text-2xl">Top</p><p className="text-[10px] text-slate-400 sm:text-xs">Competitions</p></div><div className="rounded-xl border border-white/10 bg-black/20 p-3"><Activity className="mb-2 text-edil-green" size={17}/><p className="text-lg font-black sm:text-2xl">Odds</p><p className="text-[10px] text-slate-400 sm:text-xs">Compare markets</p></div></div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><SportsbookStat icon={<Activity size={17}/>} label="Matches listed" value={String(markets.length).padStart(2, '0')} note="Across competitions"/><SportsbookStat icon={<Zap size={17}/>} label="Live right now" value={String(markets.filter(m => m.live).length).padStart(2, '0')} note="Follow the action"/><SportsbookStat icon={<Trophy size={17}/>} label="Sports" value="05+" note="Find your game"/><SportsbookStat icon={<Clock3 size={17}/>} label="Market status" value="Open" note="Demo match data"/></div>

      <div id="markets" className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="hidden rounded-2xl border border-white/10 bg-edil-900 p-3 lg:block"><p className="px-3 pb-3 pt-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Browse sports</p>{sports.map((s) => <button key={s.name} onClick={() => { setSport(s.name); setActiveNav('Sports') }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition ${sport === s.name ? 'bg-edil-green/10 text-edil-green' : 'text-slate-300 hover:bg-white/5'}`}><span><span className="mr-3">{s.icon}</span>{s.name}</span><ChevronRight size={15} className="text-slate-600"/></button>)}<div className="my-4 border-t border-white/10"/><p className="px-3 pb-3 text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Your account</p><button onClick={() => setAuthOpen('login')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5"><UserRound size={17}/> My account</button><button onClick={() => setAuthOpen('login')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5"><Ticket size={17}/> My bets</button></aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><h2 className="text-xl font-black tracking-tight">{activeNav === 'Live' || sport === 'Live' ? 'Live matches' : activeNav === 'Results' ? 'Match results' : activeNav === 'Promotions' ? 'Featured matches' : 'Sports markets'}</h2><span className="rounded-md bg-edil-green/10 px-2 py-1 text-[10px] font-black text-edil-green">{visibleMarkets.length} EVENTS</span></div><p className="mt-1 text-xs text-slate-500">Choose an outcome to add it to your bet slip</p></div><label className="flex items-center gap-2 rounded-xl border border-white/10 bg-edil-900 px-3 py-2.5 focus-within:border-edil-green/50"><Search size={16} className="text-slate-500"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams or leagues..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600 sm:w-48"/></label></div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">{categories.map(c => <button key={c} onClick={() => { setSport(c); if (c === 'Live') setActiveNav('Sports') }} className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition ${sport === c ? 'border-edil-green/40 bg-edil-green/10 text-edil-green' : 'border-white/10 bg-edil-900 text-slate-400 hover:text-white'}`}>{c === 'Live' && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red-500"/>}{c}</button>)}</div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-edil-900"><div className="flex items-center justify-between border-b border-white/10 bg-white/[.025] px-4 py-3"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300"><Trophy size={15} className="text-edil-green"/> Featured events</div><span className="text-[10px] text-slate-500">1X2 · Match winner</span></div>
            {visibleMarkets.map((market) => (
              <article key={market.id} className="border-b border-white/[.07] p-4 last:border-0 hover:bg-white/[.015]">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="truncate text-[9px] font-black tracking-[.13em] text-slate-500">{market.league}</p>
                  {market.live ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase text-red-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Live · {market.score}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] text-slate-500">{market.time}</span>
                  )}
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(150px,.9fr)] items-center gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold sm:text-base">{market.home}</p>
                    <p className="my-1 text-[10px] font-black uppercase tracking-wider text-slate-600">VS</p>
                    <p className="truncate text-sm font-bold sm:text-base">{market.away}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['1', 'X', '2'] as const).map((key, i) => {
                      const selected = picks.some((pick) => pick.market.id === market.id && pick.selection === key)
                      const odd = market.odds[i]
                      return (
                        <button
                          key={key}
                          onClick={() => togglePick(market, key, odd)}
                          disabled={odd === "—"}
                          className={`flex min-w-0 flex-col items-center justify-center rounded-lg border px-1 py-2.5 transition sm:py-3 ${selected ? "border-edil-green bg-edil-green text-slate-950 shadow-glow" : "border-white/[.08] bg-[#111c2d] hover:border-edil-green/50 hover:bg-edil-green/5"} disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                          <span className={`text-[9px] font-bold ${selected ? "text-slate-700" : "text-slate-500"}`}>
                            {key === "1" ? "HOME" : key === "X" ? "DRAW" : "AWAY"}
                          </span>
                          <span className="mt-1 text-sm font-black tabular-nums">{odd}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </article>
            ))}
            {!visibleMarkets.length && <div className="p-10 text-center"><Search className="mx-auto mb-3 text-slate-600" size={24}/><p className="font-bold">No matches found</p><p className="mt-1 text-xs text-slate-500">Try another team name or category.</p></div>}
          </div>
          <p className="mt-3 flex items-start gap-2 text-[10px] leading-5 text-slate-500"><ShieldCheck size={14} className="mt-0.5 shrink-0"/> Odds displayed are sample UI data until connected to your betting-odds server. Bet responsibly. 18+.</p>
        </section>

        <aside className="overflow-hidden rounded-2xl border border-white/10 bg-edil-900 lg:sticky lg:top-24"><div className="flex items-center justify-between border-b border-white/10 px-4 py-4"><div className="flex items-center gap-2"><Ticket size={17} className="text-edil-green"/><h2 className="font-black">Bet slip</h2><span className="grid h-5 min-w-5 place-items-center rounded-full bg-edil-green px-1 text-[10px] font-black text-slate-950">{picks.length}</span></div><button onClick={() => setPicks([])} className="text-[10px] font-bold text-slate-500 hover:text-white">Clear all</button></div>
          {!picks.length ? <div className="px-5 py-8 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-slate-500"><Ticket size={22}/></div><p className="text-sm font-bold">Your slip is empty</p><p className="mx-auto mt-1 max-w-[200px] text-xs leading-5 text-slate-500">Select odds from any match to start building your bet.</p><div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold text-edil-green"><ArrowDownRight size={14}/> PICK YOUR ODDS</div></div> : <div className="p-4">{picks.map(p => <div key={p.market.id} className="mb-3 rounded-xl border border-white/10 bg-[#111c2d] p-3"><div className="flex items-start justify-between gap-2"><p className="text-xs font-bold leading-5">{p.market.home} <span className="text-slate-500">vs</span> {p.market.away}</p><button onClick={() => setPicks(curr => curr.filter(x => x.market.id !== p.market.id))} className="text-slate-500 hover:text-red-400" aria-label="Remove selection"><X size={14}/></button></div><div className="mt-2 flex items-center justify-between text-xs"><span className="text-slate-400">Match winner · {p.selection === '1' ? 'Home' : p.selection === 'X' ? 'Draw' : 'Away'}</span><strong className="text-edil-green">{p.odd}</strong></div></div>)}
            <div className="mt-4"><label htmlFor="stake" className="mb-2 block text-xs font-bold text-slate-400">Stake (ETB)</label><input id="stake" type="number" min="1" value={stake} onChange={e => setStake(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111c2d] px-3 py-3 text-sm font-bold outline-none focus:border-edil-green/60"/></div><div className="mt-4 space-y-2 rounded-xl bg-black/20 p-3"><div className="flex justify-between text-xs text-slate-400"><span>Total odds</span><strong className="text-white">{totalOdds.toFixed(2)}</strong></div><div className="flex justify-between text-xs text-slate-400"><span>Potential return</span><strong className="text-lg font-black text-edil-green">{Number.isFinite(potentialReturn) ? potentialReturn.toFixed(2) : '0.00'} ETB</strong></div></div><button onClick={() => { if (!isLoggedIn) setAuthOpen('login'); else setNotice('Bet placement is not connected yet. No real wager has been placed.') }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-edil-green py-3.5 text-sm font-black text-slate-950 hover:bg-lime-300">Place bet <ArrowUpRight size={16}/></button><p className="mt-2 text-center text-[10px] leading-4 text-slate-500">Demo only. No real money wagered.</p></div>}
          <div className="border-t border-white/10 bg-black/10 p-4"><div className="flex items-center gap-2 text-xs font-bold text-slate-400"><ShieldCheck size={15} className="text-edil-green"/> Play responsibly</div><p className="mt-1 text-[10px] leading-4 text-slate-500">Set limits and only bet what you can afford to lose.</p></div>
        </aside>
      </div>
    </main>
    <footer className="mt-8 border-t border-white/10 bg-[#0c1422]"><div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p><strong className="text-slate-300">EDIL<span className="text-edil-green">BET</span></strong> <span className="ml-2">Sportsbook experience</span></p><div className="flex flex-wrap gap-4"><span>Responsible gaming</span><span>Terms & conditions</span><span>Privacy</span><span>18+ only</span></div><p>© {new Date().getFullYear()} EdilBet</p></div></footer>
    {notice && <div role="status" className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-start gap-3 rounded-xl border border-edil-green/30 bg-[#172438] p-4 shadow-2xl"><CircleHelp size={18} className="mt-0.5 shrink-0 text-edil-green"/><p className="flex-1 text-sm leading-5">{notice}</p><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}
    {authOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => { setAuthOpen(null); setNotice('') }}><div role="dialog" aria-modal="true" aria-labelledby="auth-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-edil-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-black tracking-[.15em] text-edil-green">WELCOME TO EDILBET</p><h2 id="auth-title" className="mt-2 text-2xl font-black">{authOpen === 'login' ? 'Log in to your account' : 'Create your account'}</h2></div><button onClick={() => { setAuthOpen(null); setNotice('') }} className="rounded-lg p-2 text-slate-400 hover:bg-white/5" aria-label="Close"><X size={18}/></button></div><form onSubmit={submitAuth} className="space-y-4"><label className="block text-xs font-bold text-slate-400">Phone number<input required type="tel" placeholder="+251 9..." className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-edil-green/60"/></label><label className="block text-xs font-bold text-slate-400">Password<input required type="password" minLength={6} placeholder="Enter your password" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-edil-green/60"/></label>{notice && <p className="rounded-lg bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">{notice}</p>}<button type="submit" className="w-full rounded-xl bg-edil-green py-3.5 text-sm font-black text-slate-950 hover:bg-lime-300">{authOpen === 'login' ? 'Log in' : 'Create account'}</button></form><p className="mt-5 text-center text-xs text-slate-500">{authOpen === 'login' ? 'New to EdilBet?' : 'Already have an account?'} <button onClick={() => { setAuthOpen(authOpen === 'login' ? 'register' : 'login'); setNotice('') }} className="font-bold text-edil-green hover:underline">{authOpen === 'login' ? 'Join now' : 'Log in'}</button></p><p className="mt-4 text-center text-[10px] leading-4 text-slate-600">Frontend preview only. Connect your existing authentication endpoints before production use.</p></div></div>}
  </div>
}
