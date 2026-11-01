"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };
type ToastContextValue = { toast: (message: string, kind?: ToastKind) => void };
const ToastContext = createContext<ToastContextValue | null>(null);
let toastSequence = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    if (!message.trim()) return;
    const id = ++toastSequence;
    setItems((current) => [...current, { id, kind, message: message.trim() }].slice(-4));
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const timers = items.map((item) => window.setTimeout(() => setItems((current) => current.filter((toastItem) => toastItem.id !== item.id)), item.kind === "error" ? 6500 : 4200));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [items]);

  return <ToastContext.Provider value={{ toast }}>
    {children}
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed right-4 top-4 z-[300] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-6">
      {items.map((item) => {
        const Icon = item.kind === "success" ? CheckCircle2 : item.kind === "error" ? XCircle : Info;
        const palette = item.kind === "success" ? "border-emerald-500/40 bg-emerald-950 text-emerald-50" : item.kind === "error" ? "border-red-500/40 bg-red-950 text-red-50" : "border-sky-500/40 bg-slate-900 text-slate-50";
        return <div key={item.id} role={item.kind === "error" ? "alert" : "status"} className={`pointer-events-auto flex items-start gap-3 border px-4 py-3 shadow-2xl ${palette}`}>
          <Icon size={19} className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1 text-sm leading-5">{item.message}</p>
          <button type="button" aria-label="Dismiss notification" onClick={() => setItems((current) => current.filter((toastItem) => toastItem.id !== item.id))} className="shrink-0 p-0.5 opacity-75 hover:opacity-100"><X size={16}/></button>
        </div>;
      })}
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value.toast;
}
