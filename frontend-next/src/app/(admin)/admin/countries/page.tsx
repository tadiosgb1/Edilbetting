"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Globe2, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/services/api-client";
import { countryService, type Country, type CountryPayload, type CountryPage } from "@/services/country.service";

type View = "all" | "active";
const emptyForm: CountryPayload = { name: "", iso2: "", iso3: "", is_active: true };


export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [view, setView] = useState<View>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<"name"|"iso2"|"iso3"|"is_active"|"created_at"|"updated_at">("name");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("asc");
  const [pagination, setPagination] = useState<CountryPage>({ count: 0, total_pages: 1, current_page: 1, next: null, previous: null, page_size: 10, data: [] });
  const [form, setForm] = useState<CountryPayload>(emptyForm);
  const [editing, setEditing] = useState<Country | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);

  const load = useCallback(async (mode: View = "all", nextUrl?: string) => {
    setLoading(true);
    setError("");
    try {
      if (mode === "active") {
        const rows = await countryService.active();
        setCountries(rows);
        setPagination({ count: rows.length, total_pages: Math.max(1, Math.ceil(rows.length / pageSize)), current_page: 1, next: null, previous: null, page_size: pageSize, data: rows });
      } else {
        const result = nextUrl ? await countryService.pageFromUrl(nextUrl) : await countryService.page(pageSize);
        setCountries(result.data);
        setPagination(result);
        setPage(result.current_page);
      }
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Unable to load countries."));
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { void load("all"); }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter((country) => [country.name, country.iso2, country.iso3].some((value) => value.toLowerCase().includes(query)));
  }, [countries, search]);
  const totalPages = pagination.total_pages;
  const visible = [...filtered].sort((a,b) => String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), undefined, {numeric:true}) * (sortDir === "asc" ? 1 : -1));
  function toggleSort(key: typeof sortKey) { setSortDir(sortKey === key && sortDir === "asc" ? "desc" : "asc"); setSortKey(key); }
  function sortHeader(label: string, key: typeof sortKey) { return <th><button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1.5 font-semibold hover:text-[var(--brand)]">{label}{sortKey === key ? (sortDir === "asc" ? <ArrowUp size={13}/> : <ArrowDown size={13}/>) : <ArrowUpDown size={13} className="opacity-40"/>}</button></th>; }

  useEffect(() => { setPage(1); }, [search, view]);

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

    {error && !formOpen && !deleteTarget && <div role="alert" className="flex items-center justify-between gap-3 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error" title="Dismiss error" className="shrink-0 rounded-md p-1 text-red-700 transition hover:bg-red-100"><X size={16}/></button></div>}
    {notice && <div role="status" className="flex items-center justify-between gap-3 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><span className="min-w-0 flex-1">{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss success message" title="Dismiss success message" className="shrink-0 p-1 text-emerald-700 transition hover:bg-emerald-100"><X size={16}/></button></div>}

    <section className="dashboard-card rounded-xl p-0">
      <div className="dashboard-data-table-toolbar flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div><h2 className="font-semibold">All countries</h2><p className="mt-1 text-xs dashboard-muted">{pagination.count} countries</p></div>
        <button onClick={() => void load(view)} disabled={loading} aria-label="Refresh" title="Refresh" className="dashboard-secondary-button management-icon-button disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/></button>
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
        <thead className="dashboard-data-table-head"><tr>{sortHeader("Country","name")}{sortHeader("ISO2","iso2")}{sortHeader("ISO3","iso3")}{sortHeader("Status","is_active")}{sortHeader("Created / Updated","updated_at")}<th className="text-right">Actions</th></tr></thead>
        <tbody>{visible.map((country) => <tr key={country.id ?? country._id ?? country.iso2} className="dashboard-data-table-row transition-colors">
          <td><span className="font-medium">{country.name}</span></td>
          <td><span className="font-mono text-xs dashboard-muted">{country.iso2}</span></td>
          <td className="font-mono text-xs dashboard-muted">{country.iso3}</td>
          <td><span className={`dashboard-table-badge rounded-md px-2.5 py-1 text-xs font-semibold ${country.is_active ? "" : "opacity-60"}`}>{country.is_active ? "Active" : "Inactive"}</span></td>
          <td><div className="space-y-1 text-xs dashboard-muted"><div><span className="font-medium">Created:</span> {country.created_at ? new Date(country.created_at).toLocaleString() : "—"}</div><div><span className="font-medium">Updated:</span> {country.updated_at ? new Date(country.updated_at).toLocaleString() : "—"}</div></div></td>
          <td><div className="flex justify-end gap-1"><button title="Edit" onClick={() => startEdit(country)} className="dashboard-secondary-button management-icon-button"><Pencil size={14}/></button><button title="Delete" onClick={() => setDeleteTarget(country)} className="dashboard-secondary-button management-icon-button text-red-500"><Trash2 size={14}/></button></div></td>
        </tr>)}</tbody>
      </table></div>}
      <div className="dashboard-data-table-footer mt-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs dashboard-muted">Showing {pagination.count === 0 ? 0 : (pagination.current_page - 1) * pagination.page_size + 1}–{Math.min(pagination.current_page * pagination.page_size, pagination.count)} of {pagination.count} countries</p>
          <label className="flex items-center gap-2 text-xs dashboard-muted">Show <select aria-label="Countries per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="dashboard-field rounded-lg border px-2 py-1.5 text-xs"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option><option value={500}>500</option><option value={1000}>1000</option></select> per page</label>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={!pagination.previous || loading} onClick={() => pagination.previous && void load(view, pagination.previous)} className="inline-flex items-center gap-1 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-bold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-500 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"><ChevronLeft size={15}/><span>Previous</span></button>
          <span className="whitespace-nowrap text-xs dashboard-muted">Page {pagination.current_page} of {totalPages}</span>
          <button type="button" disabled={!pagination.next || loading} onClick={() => pagination.next && void load(view, pagination.next)} className="inline-flex items-center gap-1 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-bold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-500 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"><span>Next</span><ChevronRight size={15}/></button>
        </div>
      </div>
    </section>

    {formOpen && createPortal(<div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/55 p-4" onMouseDown={(event) => {if(event.target === event.currentTarget)setFormOpen(false);}}><section role="dialog" aria-modal="true" aria-labelledby="country-form-title" className="management-modal my-auto max-h-[min(88vh,760px)] w-full max-w-xl overflow-y-auto border p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-start justify-between"><div><h2 id="country-form-title" className="text-lg font-semibold">{editing ? "Edit country" : "Add country"}</h2><p className="mt-1 text-xs dashboard-muted">Enter the country details and ISO codes.</p></div><button onClick={() => setFormOpen(false)} aria-label="Close dialog" className="dashboard-icon-button rounded-lg p-2"><X size={17}/></button></div>
      {error && <div role="alert" className="mb-4 flex items-start justify-between gap-3 border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-700"><span className="min-w-0 flex-1">{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="shrink-0 p-1 text-red-700 hover:bg-red-100"><X size={15}/></button></div>}<form onSubmit={submit} className="space-y-4"><label className="block text-xs font-medium">Country name<Input required value={form.name} onChange={(event) => setForm({...form,name:event.target.value})} placeholder="England" className="mt-2"/></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium">ISO2 code<Input required minLength={2} maxLength={2} pattern="[A-Za-z]{2}" value={form.iso2} onChange={(event) => setForm({...form,iso2:event.target.value.toUpperCase()})} placeholder="GB" className="mt-2 uppercase"/></label><label className="block text-xs font-medium">ISO3 code<Input required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" value={form.iso3} onChange={(event) => setForm({...form,iso3:event.target.value.toUpperCase()})} placeholder="GBR" className="mt-2 uppercase"/></label></div><label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 p-3"><span><span className="block text-sm font-medium">Active country</span><span className="mt-1 block text-xs dashboard-muted">Allow this country to be selected on the platform.</span></span><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({...form,is_active:event.target.checked})} className="h-4 w-4 accent-[#9fe870]"/></label><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setFormOpen(false)} className="dashboard-secondary-button rounded-xl border px-4 py-2.5 text-sm">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving && <Loader2 size={15} className="animate-spin"/>}{editing ? "Save changes" : "Create country"}</button></div></form>
    </section></div>, document.querySelector(".dashboard-root") ?? document.body)}

    {deleteTarget && createPortal(<div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/55 p-4" onMouseDown={(event) => {if(event.target === event.currentTarget)setDeleteTarget(null);}}><section role="alertdialog" aria-modal="true" aria-labelledby="delete-country-title" className="management-modal my-auto w-full max-w-md border p-5 shadow-2xl sm:p-6"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400"><Trash2 size={19}/></div><h2 id="delete-country-title" className="text-lg font-semibold">Delete {deleteTarget.name}?</h2>{error && <div role="alert" className="mt-3 flex items-start justify-between gap-3 border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-700"><span className="min-w-0 flex-1">{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="shrink-0 p-1 text-red-700 hover:bg-red-100"><X size={15}/></button></div>}<p className="mt-2 text-sm dashboard-muted">This action will permanently remove this country record. This cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDeleteTarget(null)} className="dashboard-secondary-button rounded-xl border px-4 py-2.5 text-sm">Cancel</button><button type="button" onClick={() => void removeCountry()} disabled={saving} className="inline-flex items-center gap-2 bg-red-600 px-4 py-2.5 text-sm font-semibold !text-white disabled:opacity-60" style={{color:"#fff"}}>{saving && <Loader2 size={15} className="animate-spin"/>}Delete country</button></div></section></div>, document.querySelector(".dashboard-root") ?? document.body)}
  </div>;
}
