import { useState } from 'react'
import type { ReactNode } from 'react'
import { Activity, BarChart3, Bell, ChevronRight, CircleHelp, ClipboardList, CreditCard, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Trophy, Users, Wallet, X, Building2, UserRoundCog } from 'lucide-react'
import type { TenantRole } from '../tenant'

export type DashboardSection = { id: string; label: string; icon: ReactNode }
const adminNav: DashboardSection[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17}/> },
  { id: 'users', label: 'Users & players', icon: <Users size={17}/> },
  { id: 'bets', label: 'Bets & tickets', icon: <ClipboardList size={17}/> },
  { id: 'payments', label: 'Payment proofs', icon: <CreditCard size={17}/> },
  { id: 'brands', label: 'Brands & tenants', icon: <Building2 size={17}/> },
  { id: 'sports', label: 'Sports & markets', icon: <Trophy size={17}/> },
  { id: 'events', label: 'Events', icon: <Activity size={17}/> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={17}/> },
  { id: 'settings', label: 'Settings', icon: <Settings size={17}/> },
]
const agentNav: DashboardSection[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17}/> },
  { id: 'players', label: 'My players', icon: <Users size={17}/> },
  { id: 'commissions', label: 'Commissions', icon: <Wallet size={17}/> },
  { id: 'transactions', label: 'Transactions', icon: <CreditCard size={17}/> },
  { id: 'reports', label: 'Performance reports', icon: <BarChart3 size={17}/> },
  { id: 'profile', label: 'Agent profile', icon: <UserRoundCog size={17}/> },
]

export function DashboardShell({ role, active, onNavigate, onExit, children }: { role: TenantRole; active: string; onNavigate: (id: string) => void; onExit: () => void; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav = role === 'admin' ? adminNav : agentNav
  const title = role === 'admin' ? 'Admin console' : 'Agent workspace'
  const choose = (id: string) => { onNavigate(id); setMobileOpen(false) }
  return <div className="min-h-screen bg-[#080e19] text-slate-100 lg:flex">
    {mobileOpen && <button aria-label="Close navigation overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/70 lg:hidden"/>}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/[.08] bg-[#0d1625] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[76px] items-center justify-between border-b border-white/[.08] px-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300 text-xl font-black italic text-slate-950">E</span><div><p className="font-black tracking-tight">EDIL<span className="text-lime-300">BET</span></p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{title}</p></div></div><button className="rounded-lg p-2 text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="m-4 rounded-xl border border-lime-300/15 bg-lime-300/[.06] p-3"><div className="flex items-center gap-2 text-xs font-bold text-lime-200"><ShieldCheck size={15}/> Secure workspace</div><p className="mt-1 text-[11px] leading-4 text-slate-500">Role-specific navigation and tools</p></div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4"><p className="px-3 pb-2 pt-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-600">Workspace</p>{nav.map(item => <button key={item.id} onClick={() => choose(item.id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active === item.id ? 'bg-lime-300 text-slate-950 shadow-[0_8px_24px_rgba(190,242,100,.08)]' : 'text-slate-400 hover:bg-white/[.05] hover:text-white'}`}>{item.icon}<span className="flex-1">{item.label}</span>{active === item.id && <ChevronRight size={15}/>}</button>)}</nav>
      <div className="border-t border-white/[.08] p-4"><div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[.035] p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-xs font-black">{role === 'admin' ? 'AD' : 'AG'}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{role === 'admin' ? 'Platform admin' : 'Partner agent'}</p><p className="mt-1 text-[10px] text-slate-500">Preview account</p></div><button onClick={onExit} title="Exit preview" className="text-slate-500 hover:text-white"><LogOut size={16}/></button></div><p className="px-1 text-[10px] leading-4 text-slate-600">Demo workspace · connect your API for live data and permissions.</p></div>
    </aside>
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[.08] bg-[#0a1220]/90 px-4 backdrop-blur-xl sm:px-7"><div className="flex items-center gap-3"><button className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19}/></button><div><p className="text-sm font-bold">{title}</p><p className="mt-1 hidden text-[11px] text-slate-500 sm:block">Manage your EdilBet workspace</p></div></div><div className="flex items-center gap-2"><span className="hidden items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/[.07] px-3 py-1.5 text-[10px] font-bold text-amber-200 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-amber-300"/> DEMO DATA</span><button className="rounded-xl border border-white/10 p-2.5 text-slate-400 hover:bg-white/5" aria-label="Help"><CircleHelp size={17}/></button><button className="relative rounded-xl border border-white/10 p-2.5 text-slate-400 hover:bg-white/5" aria-label="Notifications"><Bell size={17}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-lime-300"/></button><div className="ml-1 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-[#17263a] text-xs font-black">{role === 'admin' ? 'AD' : 'AG'}</div></div></header><main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}<footer className="mt-10 border-t border-white/[.07] pt-5 text-[10px] leading-5 text-slate-600">© {new Date().getFullYear()} EdilBet · Internal preview · Not connected to production betting or payment services.</footer></main></div>
  </div>
}
