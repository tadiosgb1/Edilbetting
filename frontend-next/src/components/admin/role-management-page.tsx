"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpDown, LoaderCircle, Pencil, Plus, RefreshCw, Trash2, Eye, X, Search } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/components/toast-provider";
import { getApiErrorMessage } from "@/services/api-client";
import { createRole, deleteRole, listRoles, updateRole, type RoleInput } from "@/services/management.service";
import type { SystemRole } from "@/services/permission.service";

const emptyForm: RoleInput = { name: "", description: "" };

export function RoleManagementPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [form, setForm] = useState<RoleInput>(emptyForm);
  const [modal, setModal] = useState<"create" | "edit" | "view" | null>(null);
  const [activeRole, setActiveRole] = useState<SystemRole | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setRoles(await listRoles()); }
    catch (e) { setError(getApiErrorMessage(e, t("unableToLoadRoles"))); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { void refresh(); }, [refresh]);

  const visibleRoles = roles.filter((role) => [role.name, role.description ?? ""].some((v) => v.toLowerCase().includes(search.toLowerCase())));
  function openCreate() { setActiveRole(null); setForm(emptyForm); setModal("create"); }
  function openEdit(role: SystemRole) { setActiveRole(role); setForm({ name: role.name, description: role.description ?? "" }); setModal("edit"); }
  function closeModal() { if (!saving) { setModal(null); setActiveRole(null); } }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (modal === "create") await createRole(form);
      else if (modal === "edit" && activeRole) await updateRole(activeRole.id, form);
      toast(t(modal === "create" ? "roleCreated" : "roleUpdated"), "success");
      closeModal(); await refresh();
    } catch (e) { const message = getApiErrorMessage(e, t("unableToSaveRole")); setError(message); toast(message, "error"); }
    finally { setSaving(false); }
  }
  async function remove(role: SystemRole) {
    if (!window.confirm(t("confirmDeleteRole") + " " + role.name + "?")) return;
    try { await deleteRole(role.id); toast(t("roleDeleted"), "success"); await refresh(); }
    catch (e) { const message = getApiErrorMessage(e, t("unableToDeleteRole")); setError(message); toast(message, "error"); }
  }

  return <div className="space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm dashboard-muted">{t("accessControl")}</p><h1 className="mt-1 text-2xl font-semibold">{t("roleManagement")}</h1><p className="mt-1 text-sm dashboard-muted">{t("roleManagementDescription")}</p></div>
      <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"><Plus size={16}/>{t("createRole")}</button>
    </header>
    {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <section className="dashboard-card rounded-xl p-0">
      <div className="dashboard-data-table-toolbar flex flex-wrap items-center justify-between gap-3 px-4 py-3"><h2 className="font-semibold">{t("allRoles")} <span className="dashboard-muted">({roles.length})</span></h2><button onClick={() => void refresh()} disabled={loading} className="dashboard-secondary-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/>{t("refresh")}</button></div>
      <div className="dashboard-data-table-filters relative max-w-md px-4 pb-3"><Search size={16} className="dashboard-muted absolute left-3 top-3"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchRoles")} className="dashboard-field w-full rounded-lg py-2 pl-9 pr-3 text-sm"/></div>
      {loading ? <div className="flex justify-center py-12"><LoaderCircle className="animate-spin"/></div> : visibleRoles.length === 0 ? <p className="py-12 text-center text-sm dashboard-muted">{t("noRolesFound")}</p> :
        <div className="dashboard-data-table-wrap"><table className="dashboard-data-table w-full min-w-[620px] text-left text-sm"><thead className="dashboard-data-table-head"><tr><th><span className="dashboard-table-heading">{t("roleName")}<ArrowUpDown size={13}/></span></th><th><span className="dashboard-table-heading">{t("description")}<ArrowUpDown size={13}/></span></th><th className="text-right"><span className="dashboard-table-heading dashboard-table-heading-end">{t("actions")}</span></th></tr></thead><tbody>{visibleRoles.map(role => <tr key={role.id} className="dashboard-data-table-row transition-colors"><td className="font-medium">{role.name}</td><td className="max-w-[420px] dashboard-muted"><span className="line-clamp-2">{role.description || t("noDescription")}</span></td><td><div className="flex justify-end gap-1"><button title={t("view")} onClick={() => {setActiveRole(role);setModal("view");}} className="dashboard-secondary-button rounded-lg p-2"><Eye size={15}/></button><button title={t("edit")} onClick={() => openEdit(role)} className="dashboard-secondary-button rounded-lg p-2"><Pencil size={15}/></button><button title={t("delete")} onClick={() => void remove(role)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>}
    </section>
    {modal && createPortal(<div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/55 p-4" onMouseDown={e => {if(e.target===e.currentTarget)closeModal();}}>
      <section role="dialog" aria-modal="true" aria-labelledby="role-modal-title" className="management-modal my-auto w-full max-w-lg rounded-xl border p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3"><div><h2 id="role-modal-title" className="text-lg font-semibold">{t(modal === "create" ? "createRole" : modal === "edit" ? "editRole" : "roleDetails")}</h2><p className="mt-1 text-xs dashboard-muted">{modal === "view" ? t("roleDetails") : t("roleFormHint")}</p></div><button onClick={closeModal} aria-label={t("close")} className="dashboard-secondary-button rounded-lg border p-2"><X size={17}/></button></div>
        {modal === "view" && activeRole ? <div className="space-y-4"><div><p className="text-xs dashboard-muted">{t("roleName")}</p><p className="mt-1 font-medium">{activeRole.name}</p></div><div><p className="text-xs dashboard-muted">{t("description")}</p><p className="mt-1 whitespace-pre-wrap text-sm">{activeRole.description || t("noDescription")}</p></div><div className="flex justify-end"><button onClick={() => openEdit(activeRole)} className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">{t("edit")}</button></div></div> :
        <form onSubmit={submit} className="space-y-4"><div><label htmlFor="role-name" className="mb-1.5 block text-sm font-medium">{t("roleName")}</label><input id="role-name" required value={form.name} onChange={e => setForm(v => ({...v,name:e.target.value}))} className="dashboard-field w-full rounded-lg px-3 py-2.5 text-sm"/></div><div><label htmlFor="role-description" className="mb-1.5 block text-sm font-medium">{t("description")}</label><textarea id="role-description" required rows={5} value={form.description} onChange={e => setForm(v => ({...v,description:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-3 text-sm"/></div><div className="flex justify-end gap-2 pt-3"><button type="button" onClick={closeModal} className="dashboard-secondary-button rounded-xl border px-4 py-2.5 text-sm">{t("cancel")}</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving && <LoaderCircle size={15} className="animate-spin"/>}{t("saveChanges")}</button></div></form>}
      </section>
    </div>, document.querySelector(".dashboard-root") ?? document.body)}
  </div>;
}
