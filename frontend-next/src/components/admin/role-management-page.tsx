"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Pencil, Plus, RefreshCw, Trash2, Eye, X } from "lucide-react";
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<SystemRole | null>(null);
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

  function startCreate() { setEditingId(null); setViewing(null); setForm(emptyForm); }
  function startEdit(role: SystemRole) {
    setViewing(null); setEditingId(role.id);
    setForm({ name: role.name, description: role.description ?? "" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (editingId === null) await createRole({ name: form.name, description: form.description });
      else await updateRole(editingId, { name: form.name, description: form.description });
      toast(t(editingId === null ? "roleCreated" : "roleUpdated"), "success");
      startCreate(); await refresh();
    } catch (e) {
      const message = getApiErrorMessage(e, t("unableToSaveRole"));
      setError(message); toast(message, "error");
    } finally { setSaving(false); }
  }

  async function remove(role: SystemRole) {
    if (!window.confirm(t("confirmDeleteRole") + " " + role.name + "?")) return;
    try {
      await deleteRole(role.id); toast(t("roleDeleted"), "success");
      if (editingId === role.id) startCreate();
      if (viewing?.id === role.id) setViewing(null);
      await refresh();
    } catch (e) { const message = getApiErrorMessage(e, t("unableToDeleteRole")); setError(message); toast(message, "error"); }
  }

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-sm text-emerald-400">{t("accessControl")}</p><h1 className="mt-1 text-3xl font-semibold">{t("roleManagement")}</h1><p className="mt-2 text-sm dashboard-muted">{t("roleManagementDescription")}</p></div>
      <button onClick={() => void refresh()} disabled={loading} className="dashboard-secondary-button inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/>{t("refresh")}</button>
    </header>
    {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
      <section className="rounded-2xl border dashboard-card p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{t("allRoles")} ({roles.length})</h2><button onClick={startCreate} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><Plus size={15}/>{t("createRole")}</button></div>
        {loading ? <div className="flex justify-center py-12"><LoaderCircle className="animate-spin"/></div> : roles.length === 0 ? <p className="py-10 text-center text-sm dashboard-muted">{t("noRolesFound")}</p> :
          <div className="space-y-2">{roles.map(role => <div key={role.id} className="flex flex-wrap items-center gap-3 rounded-xl border dashboard-subcard p-3">
            <div className="min-w-0 flex-1"><p className="font-medium">{role.name}</p><p className="mt-1 line-clamp-2 text-xs dashboard-muted">{role.description || t("noDescription")}</p><p className="mt-1 text-[11px] dashboard-muted">ID: {role.id}</p></div>
            <button title={t("view")} onClick={() => {setViewing(role);setEditingId(null);}} className="dashboard-secondary-button rounded-lg border p-2"><Eye size={15}/></button>
            <button title={t("edit")} onClick={() => startEdit(role)} className="dashboard-secondary-button rounded-lg border p-2"><Pencil size={15}/></button>
            <button title={t("delete")} onClick={() => void remove(role)} className="rounded-lg border border-red-500/30 p-2 text-red-400"><Trash2 size={15}/></button>
          </div>)}</div>}
      </section>
      <section className="rounded-2xl border dashboard-card p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{viewing ? t("roleDetails") : editingId === null ? t("createRole") : t("editRole")}</h2>{(viewing || editingId !== null) && <button onClick={startCreate} aria-label={t("close")}><X size={17}/></button>}</div>
        {viewing ? <div className="space-y-3"><div><p className="text-xs dashboard-muted">{t("roleName")}</p><p className="font-semibold">{viewing.name}</p></div><div><p className="text-xs dashboard-muted">{t("description")}</p><p className="text-sm">{viewing.description || t("noDescription")}</p></div><p className="text-xs dashboard-muted">ID: {viewing.id}{viewing.created_at ? " · " + new Date(viewing.created_at).toLocaleString() : ""}</p><button onClick={() => startEdit(viewing)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{t("editRole")}</button></div> :
        <form onSubmit={submit} className="space-y-4">
          <div><label htmlFor="role-name" className="mb-1.5 block text-xs font-medium dashboard-muted">{t("roleName")}</label><input id="role-name" required value={form.name} onChange={e => setForm(v => ({...v,name:e.target.value}))} placeholder="Administrator" className="dashboard-field w-full rounded-xl border px-3 py-3 text-sm"/></div>
          <div><label htmlFor="role-description" className="mb-1.5 block text-xs font-medium dashboard-muted">{t("description")}</label><textarea id="role-description" rows={5} required value={form.description} onChange={e => setForm(v => ({...v,description:e.target.value}))} placeholder="Full system access with user management..." className="dashboard-field w-full rounded-xl border px-3 py-3 text-sm"/></div>
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? <LoaderCircle size={15} className="animate-spin"/> : <Plus size={15}/ >}{saving ? t("saving") : editingId === null ? t("createRole") : t("saveChanges")}</button>
        </form>}
      </section>
    </div>
  </div>;
}
