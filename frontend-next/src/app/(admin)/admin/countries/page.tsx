"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, CircleAlert, Globe2, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/services/api-client";
import { countryService, type Country, type CountryPayload } from "@/services/country.service";

type View = "all" | "active";
const emptyForm: CountryPayload = { name: "", iso2: "", iso3: "", is_active: true };

function flagFromIso2(code: string) {
  return code.toUpperCase().replace(/[A-Z]/g, (letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397));
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [view, setView] = useState<View>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CountryPayload>(emptyForm);
  const [editing, setEditing] = useState<Country | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);

  const load = useCallback(async (mode: View = "all") => {
    setLoading(true);
    setError("");
    try {
      if (mode === "active") setCountries(await countryService.active());
      else setCountries(await countryService.list());
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Unable to load countries."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load("all"); }, [load]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter((country) => [country.name, country.iso2, country.iso3].some((value) => value.toLowerCase().includes(query)));
  }, [countries, search]);


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
    await load(next);
  }

  return <div className="space-y-5">
    <section className="dashboard-card management-heading-card">
      <header className="management-page-heading">
        <div className="management-heading-row">
          <div className="management-heading-title"><h1>Countries</h1></div>
          <button onClick={startCreate} className="management-primary-button management-create-user inline-flex items-center gap-2"><Plus size={15}/><span>Add country</span></button>
        </div>
      </header>
    </section>

    {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

    <section className="dashboard-card rounded-xl p-0">
      <div className="dashboard-data-table-toolbar flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div><h2 className="font-semibold">All countries</h2><p className="mt-1 text-xs dashboard-muted">{countries.length} countries</p></div>
        <button onClick={() => void load(view, "")} disabled={loading} aria-label="Refresh" title="Refresh" className="dashboard-secondary-button management-icon-button disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/></button>
      </div>
      <div className="dashboard-data-table-filters flex flex-wrap items-center gap-2 px-4 pb-3">
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => void chooseView("all")} className={`rounded-sm border px-3 py-1.5 text-xs font-semibold ${view === "all" ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "dashboard-secondary-button"}`}>All</button>
          <button type="button" onClick={() => void chooseView("active")} className={`rounded-sm border px-3 py-1.5 text-xs font-semibold ${view === "active" ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "dashboard-secondary-button"}`}>Active</button>
        </div>
        <div className="relative min-w-0 flex-1">
          <Search size={15} className="dashboard-muted absolute left-3 top-2.5"/>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search countries..." className="dashboard-field management-search-input w-full pl-9 pr-3 text-sm"/>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-10"><span className="management-loading-dots" role="status" aria-label="Loading"><i/><i/><i/></span></div>
      : visible.length === 0 ? <p className="py-14 text-center text-sm dashboard-muted"><Globe2 size={22} className="mx-auto mb-2 opacity-50"/>No countries found.</p>
      : <div className="dashboard-data-table-wrap"><table className="dashboard-data-table w-full min-w-[680px] text-left text-sm">
        <thead className="dashboard-data-table-head"><tr><th>Country</th><th>ISO2</th><th>ISO3</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
        <tbody>{visible.map((country) => <tr key={country.id ?? country._id ?? country.iso2} className="dashboard-data-table-row transition-colors">
          <td><div className="flex items-center gap-3"><span className="text-xl" aria-hidden="true">{flagFromIso2(country.iso2)}</span><span className="font-medium">{country.name}</span></div></td>
          <td><span className="font-mono text-xs dashboard-muted">{country.iso2}</span></td>
          <td className="font-mono text-xs dashboard-muted">{country.iso3}</td>
          <td><span className={`dashboard-table-badge rounded-md px-2.5 py-1 text-xs font-semibold ${country.is_active ? "" : "opacity-60"}`}>{country.is_active ? "Active" : "Inactive"}</span></td>
          <td><div className="flex justify-end gap-1"><button title="Edit" onClick={() => startEdit(country)} className="dashboard-secondary-button management-icon-button"><Pencil size={14}/></button><button title="Delete" onClick={() => setDeleteTarget(country)} className="dashboard-secondary-button management-icon-button text-red-500"><Trash2 size={14}/></button></div></td>
        </tr>)}</tbody>
      </table></div>}
      <div className="dashboard-data-table-footer mt-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3"><p className="text-xs dashboard-muted">Showing {visible.length} of {countries.length} countries</p></div>
    </section>

    {formOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4" role="presentation" onMouseDown={(event) => {if(event.target === event.currentTarget)setFormOpen(false);}}><section role="dialog" aria-modal="true" aria-labelledby="country-form-title" className="management-modal my-auto max-h-[min(88vh,760px)] w-full max-w-xl overflow-y-auto rounded-xl border p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-start justify-between"><div><h2 id="country-form-title" className="text-lg font-semibold">{editing ? "Edit country" : "Add country"}</h2><p className="mt-1 text-xs dashboard-muted">Enter the country details and ISO codes.</p></div><button onClick={() => setFormOpen(false)} aria-label="Close dialog" className="dashboard-icon-button rounded-lg p-2"><X size={17}/></button></div>
      <form onSubmit={submit} className="space-y-4"><label className="block text-xs font-medium">Country name<Input required value={form.name} onChange={(event) => setForm({...form,name:event.target.value})} placeholder="England" className="mt-2"/></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium">ISO2 code<Input required minLength={2} maxLength={2} pattern="[A-Za-z]{2}" value={form.iso2} onChange={(event) => setForm({...form,iso2:event.target.value.toUpperCase()})} placeholder="GB" className="mt-2 uppercase"/></label><label className="block text-xs font-medium">ISO3 code<Input required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" value={form.iso3} onChange={(event) => setForm({...form,iso3:event.target.value.toUpperCase()})} placeholder="GBR" className="mt-2 uppercase"/></label></div><label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 p-3"><span><span className="block text-sm font-medium">Active country</span><span className="mt-1 block text-xs dashboard-muted">Allow this country to be selected on the platform.</span></span><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({...form,is_active:event.target.checked})} className="h-4 w-4 accent-[#9fe870]"/></label><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 size={15} className="animate-spin"/>}{editing ? "Save changes" : "Create country"}</Button></div></form>
    </section></div>}

    {deleteTarget && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="delete-country-title" className="management-modal my-auto w-full max-w-md rounded-xl border p-5 shadow-2xl sm:p-6"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400"><Trash2 size={19}/></div><h2 id="delete-country-title" className="text-lg font-semibold">Delete {deleteTarget.name}?</h2><p className="mt-2 text-sm dashboard-muted">This action will permanently remove this country record. This cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" onClick={() => void removeCountry()} disabled={saving}>{saving && <Loader2 size={15} className="animate-spin"/>}Delete country</Button></div></section></div>}
  </div>;
}
