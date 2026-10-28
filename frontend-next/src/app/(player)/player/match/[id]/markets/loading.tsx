"use client";

export default function MatchMarketsLoading() {
  return (
    <main className="min-h-screen bg-slate-950 p-3 font-sans text-slate-100 sm:p-5" aria-label="Loading match markets" role="status">
      <div className="mx-auto max-w-screen-2xl animate-pulse">
        <div className="mb-4 flex h-14 items-center justify-between border-b border-slate-800">
          <div className="h-8 w-28 rounded bg-slate-800" />
          <div className="h-8 w-36 rounded bg-slate-800" />
        </div>
        <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_280px]">
          <aside className="hidden space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4 lg:block">
            <div className="h-4 w-24 rounded bg-slate-800" />
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-9 rounded bg-slate-800/80" />)}
          </aside>
          <section className="space-y-4">
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="h-3 w-36 rounded bg-slate-800" />
              <div className="h-7 w-64 max-w-full rounded bg-slate-800" />
              <div className="grid grid-cols-3 gap-2 pt-2">{Array.from({ length: 3 }, (_, i) => <div key={i} className="h-14 rounded-lg bg-slate-800" />)}</div>
            </div>
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4"><div className="h-4 w-40 rounded bg-slate-800" /><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Array.from({ length: 8 }, (_, j) => <div key={j} className="h-12 rounded bg-slate-800/80" />)}</div></div>)}
          </section>
          <aside className="hidden rounded-xl border border-slate-800 bg-slate-900 p-4 xl:block"><div className="mb-4 h-4 w-24 rounded bg-slate-800" /><div className="h-28 rounded-lg bg-slate-800/80" /></aside>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">Loading match markets…</p>
      </div>
    </main>
  );
}
