"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, LoaderCircle, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2, UserRoundCog, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/components/toast-provider";
import { getApiErrorMessage } from "@/services/api-client";
import { assignUserRole, createUser, deleteUser, listRoles, listUsersPage, updateUser, type ManagedUser, type UserInput } from "@/services/management.service";
import type { SystemRole } from "@/services/permission.service";

const blank: UserInput = { first_name: "", last_name: "", email: "", phone_number: "", password: "", role_id: 0 };

export function UserManagementPage() {
  const { t } = useLanguage(); const toast = useToast();
  const [users,setUsers] = useState<ManagedUser[]>([]); const [roles,setRoles] = useState<SystemRole[]>([]);
  const [form,setForm] = useState<UserInput>({...blank}); const [modal,setModal] = useState<"create"|"edit"|"view"|"assign"|null>(null);
  const [activeUser,setActiveUser] = useState<ManagedUser|null>(null); const [assignRoleId,setAssignRoleId] = useState("");
  const [loading,setLoading] = useState(true); const [saving,setSaving] = useState(false); const [error,setError] = useState("");
  const [searchInput,setSearchInput] = useState(""); const [search,setSearch] = useState("");
  const [page,setPage] = useState(1); const [totalPages,setTotalPages] = useState(1); const [count,setCount] = useState(0);
  const [moreLoading,setMoreLoading] = useState(false);

  const loadRoles = useCallback(async()=>{try{setRoles(await listRoles());}catch(e){toast(getApiErrorMessage(e,t("unableToLoadRoles")),"error");}},[t,toast]);
  const loadPage = useCallback(async(nextPage:number,term:string,append=false)=>{
    if(append)setMoreLoading(true);else setLoading(true);
    setError("");
    try{
      const result=await listUsersPage(nextPage,term);
      setUsers(current=>append?[...current,...result.data]:result.data);
      setCount(result.count);setTotalPages(result.totalPages);setPage(result.currentPage);
    }catch(e){setError(getApiErrorMessage(e,t("unableToLoadUsers")));}
    finally{setLoading(false);setMoreLoading(false);}
  },[t]);
  useEffect(()=>{void loadRoles();},[loadRoles]);
  useEffect(()=>{void loadPage(1,search);},[loadPage,search]);

  function closeModal(){if(!saving){setModal(null);setActiveUser(null);}}
  function openCreate(){setActiveUser(null);setForm({...blank});setModal("create");}
  function openEdit(user:ManagedUser){setActiveUser(user);setForm({first_name:user.first_name??"",last_name:user.last_name??"",email:user.email??"",phone_number:user.phone_number??"",password:"",role_id:Number(user.role_id??(typeof user.role==="object"?user.role?.id:0)??0)});setModal("edit");}
  function openAssign(user:ManagedUser){setActiveUser(user);setAssignRoleId(String(user.role_id??(typeof user.role==="object"?user.role?.id:"")??""));setModal("assign");}
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setError("");
    const payload:UserInput={...form,role_id:Number(form.role_id)};
    if(modal==="create"&&!payload.password){setError(t("passwordRequired"));setSaving(false);return;}
    if(modal==="edit"&&!payload.password)delete payload.password;
    try{
      if(modal==="create")await createUser(payload);
      else if(modal==="edit"&&activeUser)await updateUser(activeUser.id,payload);
      toast(t(modal==="create"?"userCreated":"userUpdated"),"success");setModal(null);setActiveUser(null);await loadPage(1,search);
    }catch(e){const msg=getApiErrorMessage(e,t("unableToSaveUser"));setError(msg);toast(msg,"error");}
    finally{setSaving(false);}
  }
  async function saveAssignment(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!activeUser||!assignRoleId)return;setSaving(true);setError("");
    try{await assignUserRole(activeUser.id,Number(assignRoleId));toast(t("roleAssigned"),"success");setModal(null);setActiveUser(null);await loadPage(page,search);}
    catch(e){const msg=getApiErrorMessage(e,t("unableToAssignRole"));setError(msg);toast(msg,"error");}
    finally{setSaving(false);}
  }
  async function remove(user:ManagedUser){
    if(!window.confirm(t("confirmDeleteUser")+" "+(user.email??user.id)+"?"))return;
    try{await deleteUser(user.id);toast(t("userDeleted"),"success");await loadPage(Math.min(page,totalPages),search);}
    catch(e){const msg=getApiErrorMessage(e,t("unableToDeleteUser"));setError(msg);toast(msg,"error");}
  }
  function roleName(user:ManagedUser){return typeof user.role==="object"?user.role?.name:user.role??roles.find(r=>r.id===user.role_id)?.name??"—";}
  function applySearch(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setPage(1);setSearch(searchInput.trim());}

  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm dashboard-muted">{t("accessControl")}</p><h1 className="mt-1 text-2xl font-semibold">{t("userManagement")}</h1><p className="mt-1 text-sm dashboard-muted">{t("userManagementDescription")}</p></div><button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"><Plus size={16}/>{t("createUser")}</button></header>
    {error&&<div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <section className="dashboard-card rounded-2xl border p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{t("allUsers")}</h2><p className="mt-1 text-xs dashboard-muted">{count} {t("usersCount")}</p></div><button onClick={()=>void loadPage(page,search)} disabled={loading} className="dashboard-secondary-button inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RefreshCw size={14} className={loading?"animate-spin":""}/>{t("refresh")}</button></div>
      <form onSubmit={applySearch} className="mb-4 flex max-w-xl gap-2"><div className="relative min-w-0 flex-1"><Search size={16} className="dashboard-muted absolute left-3 top-3"/><input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder={t("searchUsers")} className="dashboard-field w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm"/></div><button className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">{t("search")}</button></form>
      {loading?<div className="flex justify-center py-14"><LoaderCircle className="animate-spin"/></div>:users.length===0?<p className="py-14 text-center text-sm dashboard-muted">{t("noUsersFound")}</p>:
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]"><table className="dashboard-table w-full min-w-[650px] text-left text-sm"><thead className="dashboard-muted border-b bg-slate-50 text-[11px] uppercase tracking-wide dark:bg-slate-800/70"><tr><th className="px-3 py-3">{t("user")}</th><th className="px-3 py-3">{t("phoneNumber")}</th><th className="px-3 py-3">{t("role")}</th><th className="px-3 py-3 text-right">{t("actions")}</th></tr></thead><tbody>{users.map(user=><tr key={user.id} className="border-b border-[var(--line)] transition-colors last:border-0 hover:bg-[color-mix(in_srgb,var(--brand)_6%,transparent)]"><td className="px-3 py-3.5"><p className="font-medium">{[user.first_name,user.last_name].filter(Boolean).join(" ")||user.email||t("user")}</p><p className="mt-1 text-xs dashboard-muted">{user.email}</p></td><td className="px-3 py-3.5 dashboard-muted">{user.phone_number||"—"}</td><td className="px-3 py-3.5"><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{roleName(user)}</span></td><td className="px-3 py-3.5"><div className="flex justify-end gap-1"><button title={t("view")} onClick={()=>{setActiveUser(user);setModal("view");}} className="dashboard-secondary-button rounded-lg p-2"><Eye size={15}/></button><button title={t("edit")} onClick={()=>openEdit(user)} className="dashboard-secondary-button rounded-lg p-2"><Pencil size={15}/></button><div className="group relative"><button title={t("actions")} className="dashboard-secondary-button rounded-lg border p-2"><MoreHorizontal size={16}/></button><div className="dashboard-menu absolute right-0 z-20 hidden w-48 rounded-xl border p-1 shadow-lg group-focus-within:block group-hover:block"><button onClick={()=>openAssign(user)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-100 hover:text-slate-900"><UserRoundCog size={14}/>{t("assignRole")}</button><button onClick={()=>void remove(user)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"><Trash2 size={14}/>{t("delete")}</button></div></div></div></td></tr>)}</tbody></table></div>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 dark:border-slate-700/70"><p className="text-xs dashboard-muted">{t("page")} {page} {t("of")} {totalPages}</p><div className="flex items-center gap-2"><button disabled={page<=1||loading} onClick={()=>void loadPage(page-1,search)} className="dashboard-secondary-button inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs disabled:opacity-40"><ChevronLeft size={14}/>{t("previous")}</button><button disabled={page>=totalPages||loading} onClick={()=>void loadPage(page+1,search)} className="dashboard-secondary-button inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs disabled:opacity-40">{t("next")}<ChevronRight size={14}/></button></div></div>
      {page<totalPages&&<div className="mt-3 text-center"><button disabled={moreLoading||loading} onClick={()=>void loadPage(page+1,search,true)} className="dashboard-secondary-button rounded-xl border px-5 py-2.5 text-sm disabled:opacity-50">{moreLoading?<LoaderCircle size={14} className="inline animate-spin"/>:null}{t("showMore")}</button></div>}
    </section>
    {modal&&createPortal(<div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/55 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)closeModal();}}>
      <section role="dialog" aria-modal="true" aria-labelledby="user-modal-title" className="management-modal my-auto max-h-[min(88vh,760px)] w-full max-w-xl overflow-y-auto rounded-xl border p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3"><div><h2 id="user-modal-title" className="text-lg font-semibold">{t(modal==="create"?"createUser":modal==="edit"?"editUser":modal==="assign"?"assignRole":"userDetails")}</h2><p className="mt-1 text-xs dashboard-muted">{modal==="assign"?t("assignRoleDescription"):t("userFormHint")}</p></div><button onClick={closeModal} aria-label={t("close")} className="dashboard-secondary-button rounded-lg border p-2"><X size={17}/></button></div>
        {modal==="view"&&activeUser?<div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs dashboard-muted">{t("firstName")}</p><p className="mt-1 font-medium">{activeUser.first_name||"—"}</p></div><div><p className="text-xs dashboard-muted">{t("lastName")}</p><p className="mt-1 font-medium">{activeUser.last_name||"—"}</p></div><div><p className="text-xs dashboard-muted">{t("email")}</p><p className="mt-1 break-all font-medium">{activeUser.email||"—"}</p></div><div><p className="text-xs dashboard-muted">{t("phoneNumber")}</p><p className="mt-1 font-medium">{activeUser.phone_number||"—"}</p></div><div><p className="text-xs dashboard-muted">{t("role")}</p><p className="mt-1 font-medium">{roleName(activeUser)}</p></div></div><div className="flex justify-end"><button onClick={()=>openEdit(activeUser)} className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">{t("edit")}</button></div></div>:
        modal==="assign"&&activeUser?<form onSubmit={saveAssignment} className="space-y-4"><div><p className="mb-1 text-sm font-medium">{[activeUser.first_name,activeUser.last_name].filter(Boolean).join(" ")||activeUser.email}</p><p className="text-xs dashboard-muted">{activeUser.email}</p></div><div><label htmlFor="assign-user-role" className="mb-1.5 block text-sm font-medium">{t("role")}</label><select id="assign-user-role" required value={assignRoleId} onChange={e=>setAssignRoleId(e.target.value)} className="dashboard-field w-full rounded-lg px-3 py-2.5 text-sm"><option value="">{t("selectRole")}</option>{roles.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></div><div className="flex justify-end gap-2 pt-3"><button type="button" onClick={closeModal} className="dashboard-secondary-button rounded-xl border px-4 py-2.5 text-sm">{t("cancel")}</button><button disabled={saving||!assignRoleId} className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving?t("saving"):t("assignRole")}</button></div></form>:
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="user-first" className="mb-1.5 block text-sm font-medium">{t("firstName")}</label><input id="user-first" required value={form.first_name} onChange={e=>setForm(v=>({...v,first_name:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-3 text-sm"/></div><div><label htmlFor="user-last" className="mb-1.5 block text-sm font-medium">{t("lastName")}</label><input id="user-last" required value={form.last_name} onChange={e=>setForm(v=>({...v,last_name:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-3 text-sm"/></div><div className="sm:col-span-2"><label htmlFor="user-email" className="mb-1.5 block text-sm font-medium">{t("email")}</label><input id="user-email" type="email" required value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-3 text-sm"/></div><div><label htmlFor="user-phone" className="mb-1.5 block text-sm font-medium">{t("phoneNumber")}</label><input id="user-phone" required value={form.phone_number} onChange={e=>setForm(v=>({...v,phone_number:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-3 text-sm"/></div><div><label htmlFor="user-role" className="mb-1.5 block text-sm font-medium">{t("role")}</label><select id="user-role" required value={form.role_id||""} onChange={e=>setForm(v=>({...v,role_id:Number(e.target.value)}))} className="dashboard-field w-full rounded-xl border px-3 py-3 text-sm"><option value="">{t("selectRole")}</option>{roles.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></div><div className="sm:col-span-2"><label htmlFor="user-password" className="mb-1.5 block text-sm font-medium">{t(modal==="create"?"password":"newPasswordOptional")}</label><input id="user-password" type="password" required={modal==="create"} autoComplete="new-password" value={form.password??""} onChange={e=>setForm(v=>({...v,password:e.target.value}))} className="dashboard-field w-full rounded-xl border px-3 py-3 text-sm"/></div><div className="sm:col-span-2 flex justify-end gap-2 pt-3"><button type="button" onClick={closeModal} className="dashboard-secondary-button rounded-xl border px-4 py-2.5 text-sm">{t("cancel")}</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving&&<LoaderCircle size={15} className="animate-spin"/>}{saving?t("saving"):t("saveChanges")}</button></div></form>}
      </section>
    </div>,document.body)}
  </div>;
}
