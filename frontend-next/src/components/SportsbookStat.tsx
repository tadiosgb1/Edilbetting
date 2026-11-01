import type { ReactNode } from 'react'

export default function SportsbookStat({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-white/10 bg-edil-900 p-4">
    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">{label}</span><span className="text-edil-green">{icon}</span></div>
    <p className="mt-3 text-2xl font-black tracking-tight">{value}</p>
    <p className="mt-1 text-[10px] text-slate-500">{note}</p>
  </div>
}
