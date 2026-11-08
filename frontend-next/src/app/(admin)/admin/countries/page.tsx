"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Activity, Check, ChevronRight, CircleAlert, Globe2, Loader2, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/services/api-client";
import { countryService, type Country, type CountryPayload } from "@/services/country.service";

type View = "all" | "active" | "iso2";
const emptyForm: CountryPayload = { name: "", iso2: "", iso3: "", is_active: true };

function flagFromIso2(code: string) {
  return code.toUpperCase().replace(/[A-Z]/g, (letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397));
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [view, setView] = useState<View>("all");
  const [iso2Filter, setIso2Filter] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CountryPayload>(emptyForm);
  const [editing, setEditing] = useState<Country | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);

  const load = useCallback(async (mode: View = "all", code = "") => {
    setLoading(true);
    setError("");
    try {
      if (mode === "active") setCountries(await countryService.active());
      else if (mode === "iso2") {
        const country = await countryService.byIso2(code.trim());
        setCountries(country ? [country] : []);
      } else setCountries(await countryService.list());
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Unable to load countries."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load("all", ""); }, [load]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter((country) => [country.name, country.iso2, country.iso3].some((value) => value.toLowerCase().includes(query)));
  }, [countries, search]);

  const activeCount = countries.filter((country) => country.is_active).length;
  const inactiveCount = countries.length - activeCount;

  function startCreate() {
    setEditing(null); setForm(emptyForm); setFormOpen(true); setError(""); setNotice("");
  }
  function startEdit(country: Country) {
    setEditing(country);
    setForm({ name: country.name, iso2: country.iso2, iso3: country.iso3, is_active: country.is_active });
    setFormOpen(true); setError(""); setNotice("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = { name: form.name.trim(), iso2: form.iso2.trim().toUpperCase(), iso3: form.iso3.trim().toUpperCase(), is_active: form.is_active };
    if (!payload.name || !/^[A-Z]{2}$/.test(payload.iso2) || !/^[A-Z]{3}$/.test(payload.iso3)) {
      setError("Enter a country name, a 2-letter ISO code and a 3-letter ISO code."); return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      if (editing) await countryService.update(editing, payload);
      else await countryService.create(payload);
      setFormOpen(false);
      setNotice(editing ? "Country updated successfully." : "Country created successfully.");
      await load();
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Unable to save country."));
    } finally { setSaving(false); }
  }
  async function removeCountry() {
    if (!deleteTarget) return;
    setSaving(true); setError("");
    try {
      await countryService.remove(deleteTarget);
      setDeleteTarget(null); setNotice("Country deleted successfully."); await load();
    } catch (cause) { setError(getApiErrorMessage(cause, "Unable to delete country.")); }
    finally { setSaving(false); }
  }
  async function chooseView(next: View) {
    setView(next);
    if (next === "iso2") {
      if (!/^[A-Za-z]{2}$/.test(iso2Filter.trim())) { setError("Enter a valid two-letter ISO2 code first."); return; }
      await load(next, iso2Filter);
    } else await load(next, "");
  }

  return <div className="space-y-6">
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs dashboard-muted"><Link href="/admin" className="hover:underline">Overview</Link><ChevronRight size={13}/><span className="font-medium dashboard-crumb-current">Countries</span></nav>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#9fe870]"><Globe2 size={14}/>Location settings</div><h1 className="text-3xl font-semibold tracking-tight">Countries</h1><p className="mt-2 max-w-xl text-sm dashboard-muted">Manage the countries available across your platform, including their ISO identifiers and availability.</p></div>
      <Button onClick={startCreate}><Plus size={16}/>Add country</Button>
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="countries-stat-card"><div className="countries-stat-icon"><Globe2 size={17}/></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium dashboard-muted">Countries in view</span><strong className="countries-stat-value">{countries.length}</strong></div><p className="mt-1 text-[11px] dashboard-muted">Returned by selected endpoint</p></div></Card>
      <Card className="countries-stat-card"><div className="countries-stat-icon"><ShieldCheck size={17}/></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium dashboard-muted">Active countries</span><strong className="countries-stat-value">{activeCount}</strong></div><p className="mt-1 text-[11px] dashboard-muted">Enabled for platform use</p></div></Card>
      <Card className="countries-stat-card"><div className="countries-stat-icon"><Activity size={17}/></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium dashboard-muted">Inactive countries</span><strong className="countries-stat-value">{inactiveCount}</strong></div><p className="mt-1 text-[11px] dashboard-muted">Currently disabled</p></div></Card>
    </div>

    {(error || notice) && <div role="status" className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"}`}>{error ? <CircleAlert size={17} className="mt-0.5 shrink-0"/> : <Check size={17} className="mt-0.5 shrink-0"/>}<span className="flex-1">{error || notice}</span><button onClick={() => {setError("");setNotice("");}} aria-label="Dismiss message"><X size={15}/></button></div>}

    <Card className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-5">
        <div><CardTitle>Country directory</CardTitle><p className="mt-1 text-xs dashboard-muted">Create, edit, filter and remove country records.</p></div>
        <Button className="countries-accent-button" variant="secondary" size="sm" onClick={() => void load(view, iso2Filter)} disabled={loading}><RefreshCw size={14} className={loading ? "animate-spin" : ""}/>Refresh</Button>
      </div>
      <div className="flex flex-col gap-3 border-b border-white/5 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button className={`countries-accent-button ${view === "all" ? "is-selected" : ""}`} size="sm" variant="secondary" onClick={() => void chooseView("all")}>All countries</Button>
          <Button className={`countries-accent-button ${view === "active" ? "is-selected" : ""}`} size="sm" variant="secondary" onClick={() => void chooseView("active")}>Active countries</Button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 sm:w-56"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 dashboard-muted"/><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or ISO code..." className="pl-9"/></div>
          <form className="flex gap-2" onSubmit={(event) => {event.preventDefault();void chooseView("iso2");}}><Input aria-label="Filter by ISO2" value={iso2Filter} maxLength={2} onChange={(event) => setIso2Filter(event.target.value.toUpperCase())} placeholder="ISO2 (e.g. GB)" className="w-28 uppercase"/><Button className={`countries-accent-button ${view === "iso2" ? "is-selected" : ""}`} type="submit" size="md" variant="secondary">Filter</Button></form>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="dashboard-table w-full min-w-[680px] text-left text-sm">
          <thead><tr><th className="px-5 py-3 font-medium">Country</th><th className="px-5 py-3 font-medium">ISO2</th><th className="px-5 py-3 font-medium">ISO3</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-5 py-12 text-center dashboard-muted"><Loader2 size={20} className="mx-auto mb-2 animate-spin"/>Loading countries…</td></tr>
            : visible.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center dashboard-muted"><Globe2 size={24} className="mx-auto mb-2 opacity-50"/>No countries found. Add a country or adjust your filters.</td></tr>
            : visible.map((country) => <tr key={country.id ?? country._id ?? country.iso2} className="border-t border-white/5">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="text-2xl" aria-hidden="true">{flagFromIso2(country.iso2)}</span><span className="font-medium">{country.name}</span></div></td>
              <td className="px-5 py-4"><span className="rounded-md border border-white/10 px-2 py-1 font-mono text-xs dashboard-muted">{country.iso2}</span></td>
              <td className="px-5 py-4 font-mono text-xs dashboard-muted">{country.iso3}</td>
              <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${country.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}><span className={`h-1.5 w-1.5 rounded-full ${country.is_active ? "bg-emerald-400" : "bg-slate-400"}`}/>{country.is_active ? "Active" : "Inactive"}</span></td>
              <td className="px-5 py-4"><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => startEdit(country)} aria-label={`Edit ${country.name}`}><Pencil size={15}/><span className="hidden sm:inline">Edit</span></Button><Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={() => setDeleteTarget(country)} aria-label={`Delete ${country.name}`}><Trash2 size={15}/><span className="hidden sm:inline">Delete</span></Button></div></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 px-5 py-3 text-[11px] dashboard-muted"><span>Showing {visible.length} of {countries.length} countries</span><span>Data is loaded from the Countries API</span></div>
    </Card>

    {formOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4" role="presentation" onMouseDown={(event) => {if(event.target === event.currentTarget)setFormOpen(false);}}><section role="dialog" aria-modal="true" aria-labelledby="country-form-title" className="dashboard-menu w-full max-w-lg rounded-2xl border p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 id="country-form-title" className="text-lg font-semibold">{editing ? "Edit country" : "Add country"}</h2><p className="mt-1 text-xs dashboard-muted">Enter the country details and ISO codes.</p></div><button onClick={() => setFormOpen(false)} aria-label="Close dialog" className="dashboard-icon-button rounded-lg p-2"><X size={17}/></button></div>
      <form onSubmit={submit} className="space-y-4"><label className="block text-xs font-medium">Country name<Input required value={form.name} onChange={(event) => setForm({...form,name:event.target.value})} placeholder="England" className="mt-2"/></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium">ISO2 code<Input required minLength={2} maxLength={2} pattern="[A-Za-z]{2}" value={form.iso2} onChange={(event) => setForm({...form,iso2:event.target.value.toUpperCase()})} placeholder="GB" className="mt-2 uppercase"/></label><label className="block text-xs font-medium">ISO3 code<Input required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" value={form.iso3} onChange={(event) => setForm({...form,iso3:event.target.value.toUpperCase()})} placeholder="GBR" className="mt-2 uppercase"/></label></div><label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 p-3"><span><span className="block text-sm font-medium">Active country</span><span className="mt-1 block text-xs dashboard-muted">Allow this country to be selected on the platform.</span></span><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({...form,is_active:event.target.checked})} className="h-4 w-4 accent-[#9fe870]"/></label><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 size={15} className="animate-spin"/>}{editing ? "Save changes" : "Create country"}</Button></div></form>
    </section></div>}

    {deleteTarget && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="delete-country-title" className="dashboard-menu w-full max-w-md rounded-2xl border p-6 shadow-2xl"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400"><Trash2 size={19}/></div><h2 id="delete-country-title" className="text-lg font-semibold">Delete {deleteTarget.name}?</h2><p className="mt-2 text-sm dashboard-muted">This action will permanently remove this country record. This cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" onClick={() => void removeCountry()} disabled={saving}>{saving && <Loader2 size={15} className="animate-spin"/>}Delete country</Button></div></section></div>}
  </div>;
}
