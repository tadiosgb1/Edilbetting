"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, BadgePercent, Bell, Check, ChevronRight, CircleHelp, CreditCard, Gift, History, Mail, MessageSquare, Settings, ShieldCheck, Ticket, UserRound, Users, Wallet } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const sections = [
  { id: "bonus-points", label: "Bonus points", detail: "Your rewards and bonus activity", icon: Gift },
  { id: "main-account", label: "Main account (ETB)", detail: "Wallet balance and account activity", icon: Wallet },
  { id: "unsettled-bets", label: "Unsettled bets", detail: "Bets awaiting settlement", icon: Ticket },
  { id: "deposit", label: "Make a deposit", detail: "Add funds to your wallet", icon: ArrowDownToLine },
  { id: "withdraw", label: "Withdraw funds", detail: "Request a wallet withdrawal", icon: ArrowUpFromLine },
  { id: "invite-friends", label: "Invite friends", detail: "Share EdilBet with friends", icon: Users },
  { id: "profile", label: "Personal profile", detail: "Your account details", icon: UserRound },
  { id: "bet-history", label: "Bet history", detail: "Review previous bets", icon: History },
  { id: "settings", label: "Account settings", detail: "Odds, market view and display options", icon: Settings },
  { id: "messages", label: "Messages", detail: "Notifications and account messages", icon: Mail },
];

const oddsFormats = ["Decimal (2.20)", "US (+120)", "UK (+6/5)", "Hong Kong (1.20)", "Indonesian (+1.20)", "Malaysian (-0.83)"];
const defaultPreferences = { oddsFormat: "Decimal (2.20)", marketView: "Full", liveAccumulator: true, accumulatorOfDay: true, newWindowStats: false, moveVideoOnScroll: false, showGameId: false, disableMelZones: false, accessibleMarkets: false };

export default function PlayerAccountSectionPage() {
  const params = useParams<{ section: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const section = sections.find((item) => item.id === params.section) || sections[0];
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("500");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("edilbet-player-preferences");
      if (saved) setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
      setPhone(user?.phone || "");
    } catch { /* keep defaults if browser storage is unavailable */ }
  }, [user?.phone]);

  function updatePreference<K extends keyof typeof defaultPreferences>(key: K, value: (typeof defaultPreferences)[K]) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    window.localStorage.setItem("edilbet-player-preferences", JSON.stringify(next));
    setMessage("Preference saved on this device.");
  }

  function saveRequest(kind: "deposit" | "withdraw", event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = { amount: Number(amount), currency: "ETB", phone: phone.trim(), createdAt: new Date().toISOString(), status: "pending" };
    window.localStorage.setItem(kind === "deposit" ? "edilbet-last-deposit-request" : "edilbet-last-withdraw-request", JSON.stringify(request));
    setMessage(`Your ${kind} request details were saved in this browser. No payment was processed and your wallet balance has not changed.`);
  }

  const Icon = section.icon;
  const inputClass = "w-full border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-[var(--player-brand)]";
  return (
    <main className="player-root min-h-screen bg-slate-950 text-slate-100" style={{ "--player-brand": "#16a34a" } as React.CSSProperties}>
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link href="/player" className="text-lg font-black tracking-widest text-white"><span className="bg-[var(--player-brand)] px-2 py-1 text-slate-950">EDIL</span> BET</Link>
          <Link href="/player" className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft size={16}/> Back to sports</Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">My account</p><p className="mt-2 truncate text-sm font-bold">{user?.name || "Player account"}</p><p className="mt-1 text-xs text-slate-400">{user?.phone || "Sign in to view account details"}</p></div>
          <nav className="p-2">{sections.map((item) => { const ItemIcon = item.icon; return <Link key={item.id} href={`/player/account/${item.id}`} className={`flex items-center gap-3 border-l-2 px-3 py-3 text-sm transition hover:bg-slate-800 ${section.id === item.id ? "border-[var(--player-brand)] bg-slate-800 font-semibold text-white" : "border-transparent text-slate-300"}`}><ItemIcon size={17} className="shrink-0 text-[var(--player-brand)]"/><span className="min-w-0 flex-1">{item.label}</span><ChevronRight size={14} className="text-slate-600"/></Link>; })}</nav>
        </aside>
        <section className="min-w-0 border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center border border-[var(--player-brand)]/30 bg-[var(--player-brand)]/10 text-[var(--player-brand)]"><Icon size={21}/></div><div><h1 className="text-xl font-black">{section.label}</h1><p className="mt-1 text-xs text-slate-400">{section.detail}</p></div></div></div>
          <div className="space-y-5 p-5 sm:p-6">
            {section.id === "settings" && <>
              <div><h2 className="text-sm font-bold">ODDS FORMAT</h2><p className="mt-1 text-xs text-slate-400">Choose how odds are displayed across the player interface.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{oddsFormats.map((format) => <button key={format} onClick={() => updatePreference("oddsFormat", format)} className={`flex items-center justify-between border px-3 py-3 text-left text-sm ${preferences.oddsFormat === format ? "border-[var(--player-brand)] bg-[var(--player-brand)]/10 text-white" : "border-slate-700 bg-slate-950 text-slate-300"}`}>{format}{preferences.oddsFormat === format && <Check size={16} className="text-[var(--player-brand)]"/>}</button>)}</div></div>
              <div className="border-t border-slate-800 pt-5"><h2 className="text-sm font-bold">MARKET VIEW</h2><div className="mt-3 grid grid-cols-2 border border-slate-700 p-1">{(["Full", "Short"] as const).map((view) => <button key={view} onClick={() => updatePreference("marketView", view)} className={`px-3 py-2.5 text-sm font-semibold ${preferences.marketView === view ? "bg-[var(--player-brand)] text-white" : "text-slate-400 hover:bg-slate-800"}`}>{view}</button>)}</div></div>
              <div className="border-t border-slate-800 pt-5"><h2 className="text-sm font-bold">OTHER</h2><div className="mt-2 divide-y divide-slate-800">{([{key:"liveAccumulator",label:"LIVE accumulator of the day"},{key:"accumulatorOfDay",label:"Accumulator Of The Day"},{key:"newWindowStats",label:"Display stats in a new window"},{key:"moveVideoOnScroll",label:"Move video when scrolling"},{key:"showGameId",label:"Show game ID"},{key:"disableMelZones",label:"Disable MelZones"},{key:"accessibleMarkets",label:"Markets display for the visually impaired"}] as const).map((item) => <label key={item.key} className="flex cursor-pointer items-center justify-between gap-4 py-3 text-sm text-slate-300"><span>{item.label}</span><input type="checkbox" checked={preferences[item.key]} onChange={(event) => updatePreference(item.key, event.target.checked)} className="h-4 w-4 accent-[var(--player-brand)]"/></label>)}</div></div>
            </>}
            {section.id === "bonus-points" && <div className="border border-slate-800 bg-slate-950 p-5"><p className="text-xs text-slate-400">Available bonus points</p><p className="mt-2 text-3xl font-black">0</p><p className="mt-2 text-xs leading-5 text-slate-500">Bonus rewards will appear here when a rewards program is connected to your account.</p></div>}
            {section.id === "main-account" && <><div className="border border-slate-800 bg-slate-950 p-5"><p className="text-xs text-slate-400">Main account balance</p><p className="mt-2 text-3xl font-black">ETB 0.00</p><p className="mt-2 text-xs text-slate-500">Your displayed balance is not connected to a live wallet ledger yet.</p></div><div className="grid gap-3 sm:grid-cols-2"><Link href="/player/account/deposit" className="flex items-center gap-3 border border-slate-700 p-4 hover:border-[var(--player-brand)]"><ArrowDownToLine size={19} className="text-[var(--player-brand)]"/> Make a deposit</Link><Link href="/player/account/withdraw" className="flex items-center gap-3 border border-slate-700 p-4 hover:border-[var(--player-brand)]"><ArrowUpFromLine size={19} className="text-[var(--player-brand)]"/> Withdraw funds</Link></div></>}
            {section.id === "unsettled-bets" && <div className="border border-slate-800 bg-slate-950 p-5"><p className="text-3xl font-black">0</p><p className="mt-2 text-sm font-semibold">No unsettled bets</p><p className="mt-1 text-xs leading-5 text-slate-500">This section will show open wagers once a server-backed betting and settlement system is connected.</p></div>}
            {(section.id === "deposit" || section.id === "withdraw") && <form onSubmit={(event) => saveRequest(section.id as "deposit" | "withdraw", event)} className="space-y-4"><div className="border border-amber-400/30 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100">{section.id === "deposit" ? "Payment processing is not connected. Saving a request here does not transfer money or credit your wallet." : "Withdrawals are not connected to a live wallet. Saving a request does not send money."}</div><div><label className="mb-1.5 block text-xs font-semibold text-slate-300">Amount (ETB)</label><input type="number" min="50" max="100000" step="50" required value={amount} onChange={(event) => setAmount(event.target.value)} className={inputClass}/></div><div><label className="mb-1.5 block text-xs font-semibold text-slate-300">Payment account / phone number</label><input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09XXXXXXXX" className={inputClass}/></div><button className="w-full bg-[var(--player-brand)] px-4 py-3 text-sm font-bold text-white">{section.id === "deposit" ? "Save deposit request" : "Save withdrawal request"}</button></form>}
            {section.id === "invite-friends" && <div className="space-y-3"><p className="text-sm leading-6 text-slate-300">Invite friends to discover EdilBet. Referral tracking and rewards are not connected yet.</p><div className="border border-slate-700 bg-slate-950 p-3 text-sm text-slate-400">Referral link is not available until a referral service is configured.</div><button onClick={() => { navigator.clipboard?.writeText(window.location.origin + "/player"); setMessage("Player link copied if clipboard access is available."); }} className="bg-[var(--player-brand)] px-4 py-3 text-sm font-bold text-white">Copy player link</button></div>}
            {section.id === "profile" && <div className="space-y-3">{[["Full name", user?.name || "Not signed in"],["Phone number", user?.phone || "—"],["Account role", user?.role || "Player"],["Account security","Change password from the profile menu"]].map(([label,value]) => <div key={label} className="flex flex-col gap-1 border-b border-slate-800 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-slate-400">{label}</span><span className="text-sm font-semibold">{value}</span></div>)}</div>}
            {section.id === "bet-history" && <div className="border border-slate-800 bg-slate-950 p-5"><History size={22} className="text-[var(--player-brand)]"/><p className="mt-3 text-sm font-semibold">No bet history available</p><p className="mt-1 text-xs leading-5 text-slate-500">Historical wagers will appear here when betting, settlement and account history are backed by a server.</p></div>}
            {section.id === "messages" && <div className="border border-slate-800 bg-slate-950 p-5"><MessageSquare size={22} className="text-[var(--player-brand)]"/><p className="mt-3 text-sm font-semibold">You're all caught up</p><p className="mt-1 text-xs leading-5 text-slate-500">There are no account messages stored on this device. A real inbox requires server-side notifications.</p><Link href="/player" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--player-brand)]">Browse matches <ChevronRight size={15}/></Link></div>}
            {section.id === "profile" && <Link href="/player" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--player-brand)]">Return to player <ChevronRight size={15}/></Link>}
            {message && <p role="status" className="border border-[var(--player-brand)]/30 bg-[var(--player-brand)]/10 p-3 text-xs leading-5 text-emerald-200">{message}</p>}
            <div className="border-t border-slate-800 pt-4"><p className="flex items-start gap-2 text-[11px] leading-5 text-slate-500"><ShieldCheck size={14} className="mt-0.5 shrink-0"/>Account settings are stored in this browser. Financial transactions and account records require secure server-side services.</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
