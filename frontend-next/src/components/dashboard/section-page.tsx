"use client";
import Link from "next/link";
import {useLanguage} from "@/components/language-provider";
import {Card,CardTitle} from "@/components/ui/card";
import {Search,SlidersHorizontal,FileText} from "lucide-react";
const titles:Record<string,string>={agents:"Agents",bets:"Bets",transactions:"Transactions",reports:"Reports",settings:"Settings",wallet:"Wallet & Payouts",commissions:"Commissions",players:"Players"};
export function SectionPage({role,section}:{role:"admin"|"agent";section:string}){const {t}=useLanguage();const title=t(titles[section]??(section.charAt(0).toUpperCase()+section.slice(1)));return <div className="space-y-5">
<nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs dashboard-muted"><Link href={role==="admin"?"/admin":"/agent"} className="hover:underline">{t("Overview")}</Link><span>/</span><span className="font-medium dashboard-crumb-current">{title}</span></nav>
<div><h1 className="text-3xl font-semibold">{title}</h1></div>
<Card><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle><FileText className="mr-2 inline text-[#9fe870]" size={17}/>{title}</CardTitle></div>
<div className="mt-5 flex flex-wrap items-center gap-3"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3 dashboard-muted" size={16}/><input className="dashboard-field w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#9fe870]" placeholder={t("Search")+" "+title.toLowerCase()+"..."}/></div><button className="dashboard-secondary-button flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"><SlidersHorizontal size={15}/>{t("Filters")}</button></div>
<div className="mt-6 rounded-xl border border-dashed dashboard-empty-state px-5 py-10 text-center"><div className="text-sm dashboard-muted">{t("No records to display yet.")}</div></div></Card></div>}