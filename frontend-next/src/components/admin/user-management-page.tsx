"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, LoaderCircle, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/components/toast-provider";
import { getApiErrorMessage } from "@/services/api-client";
import { createUser, deleteUser, listRoles, listUsers, updateUser, type ManagedUser, type UserInput } from "@/services/management.service";
import type { SystemRole } from "@/services/permission.service";

const blank: UserInput = { first_name: "", last_name: "", email: "", phone_number: "", password: "", role_id: 0 };

export function UserManagementPage() {
  const { t } = useLanguage(); const toast = useToast();
  const [users,setUsers] = useState<ManagedUser[]>([]); const [roles,setRoles] = useState<SystemRole[]>([]);
  const [form,setForm] = useState<UserInput>(blank); const [editingId,setEditingId] = useState<number|null>(null);
  const [viewing,setViewing] = useState<ManagedUser|null>(null); const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false); const [error,setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { const [u,r] = await Promise.all([listUsers(),listRoles()]); setUsers(u);setRoles(r); }
    catch(e) { setError(getApiErrorMessage(e,t("unableToLoadUsers"))); }
    finally { setLoading(false); }
  },[t]);
  useEffect(() => { void refresh(); },[refresh]);
  function reset(){setEditingId(null);setViewing(null);setForm({...blank});}
  function edit(user:ManagedUser){setViewing(null);setEditingId(user.id);setForm({first_name:user.first_name??"",last_name:user.last_name??"",email:user.email??"",phone_number:user.phone_number??"",password:"",role_id:Number(user.role_id??(typeof user.role==="object"?user.role?.id:0)??0)});}
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setError("");
    const payload:UserInput={...form,role_id:Number(form.role_id)};
    if(editingId===null && !payload.password){setError(t("passwordRequired"));setSaving(false);return;}
    if(editingId!==null && !payload.password) delete payload.password;
    try {
      if(editingId===null) await createUser(payload);
      else await updateUser(editingId,payload);
      toast(t(editingId===null?"userCreated":"userUpdated"),"success");reset();await refresh();
    } catch(e){const msg=getApiErrorMessage(e,t("unableToSaveUser"));setError(msg);toast(msg,"error");}
    finally{setSaving(false);}
  }
  async function remove(user:ManagedUser){
    if(!window.confirm(t("confirmDeleteUser")+" "+(user.email??user.id)+"?"))return;
    try{await deleteUser(user.id);toast(t("userDeleted"),"success");if(viewing?.id===user.id||editingId===user.id)reset();await refresh();}
    catch(e){const msg=getApiErrorMessage(e,t("unableToDeleteUser"));setError(msg);toast(msg,"error");}
  }
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-emerald-400">{t("accessControl")}</p><h1 className="mt-1 text-3xl font-semibold">{t("userManagement")}</h1><p className="mt-2 text-sm dashboard-muted">{t("userManagementDescription")}</p></div><button onClick={()=>void refresh()} disabled={loading} className="dashboard-secondary-button inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"><RefreshCw size={15} className={loading?"animate-spin":""}/>{t("refresh")}</button></header>
    {error&&<div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
      <section className="rounded-2xl border dashboard-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{t("allUsers")} ({users.length})</h2><button onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><Plus size={15}/>{t("createUser")}</button></div>
      {loading?<div className="flex justify-center py-12"><LoaderCircle className="animate-spin"/></div>:users.length===0?<p className="py-10 text-center text-sm dashboard-muted">{t("noUsersFound")}</p>:
      <div className="space-y-2">{users.map(user=><div key={user.id} className="flex flex-wrap items-center gap-3 rounded-xl border dashboard-subcard p-3"><div className="min-w-0 flex-1"><p className="font-medium">{[user.first_name,user.last_name].filter(Boolean).join(" ")||user.email||t("user")}</p><p className="mt-1 break-all text-xs dashboard-muted">{user.email} · {user.phone_number??"—"}</p><p className="mt-1 text-[11px] dashboard-muted">ID: {user.id} · {typeof user.role==="object"?user.role?.name:user.role??(roles.find(r=>r.id===user.role_id)?.name??"")}</p></div><button title={t("view")} onClick={()=>{setViewing(user);setEditingId(null);}} className="dashboard-secondary-button rounded-lg border p-2"><Eye size={15}/></button><button title={t("edit")} onClick={()=>edit(user)} className="dashboard-secondary-button rounded-lg border p-2"><Pencil size={15}/></button><button title={t("delete")} onClick={()=>void remove(user)} className="rounded-lg border border-red-500/30 p-2 text-red-400"><Trash2 size={15}/></button></div>)}</div>}</section>
      <section className="rounded-2xl border dashboard-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{viewing?t("userDetails"):editingId===null?t("createUser"):t("editUser")}</h2>{(viewing||editingId!==null)&&<button onClick={reset} aria-label={t("close")}><X size={17}/></button>}</div>
      {viewing?<div className="space-y-3"><p><span className="block text-xs dashboard-muted">{t("fullName")}</span>{viewing.first_name} {viewing.last_name}</p><p><span className="block text-xs dashboard-muted">{t("email")}</span>{viewing.email}</p><p><span className="block text-xs dashboard-muted">{t("phoneNumber")}</span>{viewing.phone_number}</p><p><span className="block text-xs dashboard-muted">{t("role")}</span>{typeof viewing.role==="object"?viewing.role?.name:viewing.role??roles.find(r=>r.id===viewing.role_id)?.name??"—"}</p><p className="text-xs dashboard-muted">ID: {viewing.id}</p><button onClick={()=>edit(viewing)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{t("editUser")}</button></div>:
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div><label className="mb-1 block text-xs dashboard-muted" htmlFor="user-first">{t("firstName")}</label><input id="user-first" required value={form.first_name} onChange={e=>setForm(v=>({...v,first_name:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-2.5 text-sm"/></div>
        <div><label className="mb-1 block text-xs dashboard-muted" htmlFor="user-last">{t("lastName")}</label><input id="user-last" required value={form.last_name} onChange={e=>setForm(v=>({...v,last_name:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-2.5 text-sm"/></div>
        <div className="sm:col-span-2"><label className="mb-1 block text-xs dashboard-muted" htmlFor="user-email">{t("email")}</label><input id="user-email" type="email" required value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-2.5 text-sm"/></div>
        <div><label className="mb-1 block text-xs dashboard-muted" htmlFor="user-phone">{t("phoneNumber")}</label><input id="user-phone" required value={form.phone_number} onChange={e=>setForm(v=>({...v,phone_number:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-2.5 text-sm"/></div>
        <div><label className="mb-1 block text-xs dashboard-muted" htmlFor="user-role">{t("role")}</label><select id="user-role" required value={form.role_id||""} onChange={e=>setForm(v=>({...v,role_id:Number(e.target.value)}))} className="dashboard-field w-full rounded-xl border px-3 py-2.5 text-sm"><option value="">{t("selectRole")}</option>{roles.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="mb-1 block text-xs dashboard-muted" htmlFor="user-password">{t(editingId===null?"password":"newPasswordOptional")}</label><input id="user-password" type="password" required={editingId===null} autoComplete="new-password" value={form.password??""} onChange={e=>setForm(v=>({...v,password:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-2.5 text-sm"/></div>
        <button disabled={saving} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving?<LoaderCircle size={15} className="animate-spin"/>:<Plus size={15}/>}{saving?t("saving"):editingId===null?t("createUser"):t("saveChanges")}</button>
      </form>}</section>
    </div>
  </div>;
}
