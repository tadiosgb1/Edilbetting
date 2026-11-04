"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, CheckCheck, LoaderCircle, RefreshCw, Save, ShieldCheck, UserRoundPlus, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useLanguage } from "@/components/language-provider";
import { getApiErrorMessage } from "@/services/api-client";
import {
  assignUserRole,
  getRolePermissions,
  getSystemPermissions,
  getSystemRoles,
  manageRolePermissions,
  type SystemPermission,
  type SystemRole,
} from "@/services/permission.service";

export function PermissionManagementPage() {
  const toast = useToast();
  const { t } = useLanguage();
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [permissions, setPermissions] = useState<SystemPermission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [assignedIds, setAssignedIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [userId, setUserId] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [assignedReady, setAssignedReady] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [assigningUser, setAssigningUser] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const selectedRole = useMemo(
    () => roles.find((role) => String(role.id) === selectedRoleId),
    [roles, selectedRoleId],
  );
  const filteredPermissions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return permissions;
    return permissions.filter((permission) =>
      [permission.name, permission.codename, permission.content_type ?? ""]
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [permissions, search]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const assignedSet = useMemo(() => new Set(assignedIds), [assignedIds]);
  const additions = useMemo(
    () => selectedIds.filter((id) => !assignedSet.has(id)),
    [selectedIds, assignedSet],
  );
  const removals = useMemo(
    () => assignedIds.filter((id) => !selectedSet.has(id)),
    [assignedIds, selectedSet],
  );
  const hasChanges = additions.length > 0 || removals.length > 0;

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setError("");
    try {
      const [roleItems, permissionItems] = await Promise.all([
        getSystemRoles(),
        getSystemPermissions(),
      ]);
      setRoles(roleItems);
      setPermissions(permissionItems);
      setSelectedRoleId((current) => current || (roleItems[0] ? String(roleItems[0].id) : ""));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t("unableToLoadRolesPermissions")));
    } finally {
      setLoadingCatalog(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    const roleId = Number(selectedRoleId);
    if (!Number.isInteger(roleId) || roleId <= 0) {
      setAssignedIds([]);
      setSelectedIds([]);
      setAssignedReady(false);
      return;
    }
    let active = true;
    setLoadingAssigned(true);
    setAssignedReady(false);
    setError("");
    getRolePermissions(roleId)
      .then((items) => {
        if (!active) return;
        const ids = Array.from(new Set(items.map((item) => item.id)));
        setAssignedIds(ids);
        setSelectedIds(ids);
        setAssignedReady(true);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setAssignedIds([]);
        setSelectedIds([]);
        setAssignedReady(false);
        setError(getApiErrorMessage(requestError, t("unableToLoadAssignedPermissions")));
      })
      .finally(() => {
        if (active) setLoadingAssigned(false);
      });
    return () => {
      active = false;
    };
  }, [selectedRoleId, t]);

  function togglePermission(permissionId: number) {
    setSelectedIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
    );
  }

  function selectAll() {
    setSelectedIds(permissions.map((permission) => permission.id));
  }

  function clearAll() {
    setSelectedIds([]);
  }

  async function savePermissions() {
    const roleId = Number(selectedRoleId);
    if (!roleId || !hasChanges) return;
    setSavingPermissions(true);
    setError("");
    try {
      await manageRolePermissions(roleId, additions, removals);
      setAssignedIds([...selectedIds]);
      toast(t("permissionsUpdated"), "success");
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, t("unableToUpdatePermissions"));
      setError(message);
      toast(message, "error");
    } finally {
      setSavingPermissions(false);
    }
  }

  async function submitUserRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedUserId = Number(userId);
    const roleId = Number(selectedRoleId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0 || !roleId) {
      setError(t("enterValidUserAndRole"));
      return;
    }
    setAssigningUser(true);
    setError("");
    try {
      await assignUserRole(parsedUserId, roleId);
      toast(t("roleAssigned"), "success");
      setUserId("");
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, t("unableToAssignRole"));
      setError(message);
      toast(message, "error");
    } finally {
      setAssigningUser(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <ShieldCheck size={17} />
            <span>{t("accessControl")}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold md:text-3xl">{t("rolesAndPermissions")}</h1>
          <p className="mt-2 max-w-2xl text-sm dashboard-muted">
            {t("permissionsIntro")}
          </p>
        </div>
        <button type="button" onClick={() => void loadCatalog()} disabled={loadingCatalog} className="dashboard-secondary-button inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm disabled:opacity-50">
          <RefreshCw size={15} className={loadingCatalog ? "animate-spin" : ""} /> {t("refresh")}
        </button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
        <div className="rounded-2xl border dashboard-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{t("rolePermissionEditor")}</h2>
              <p className="mt-1 text-xs dashboard-muted">{t("selectRoleToLoadPermissions")}</p>
            </div>
            <span className="rounded-full border px-3 py-1 text-xs dashboard-muted">{roles.length} {t("rolesCount")}</span>
          </div>

          <label htmlFor="permission-role" className="mb-2 block text-xs font-medium dashboard-muted">{t("selectRole")}</label>
          <select id="permission-role" value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)} disabled={loadingCatalog || roles.length === 0} className="dashboard-field w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-emerald-400">
            {roles.length === 0 && <option value="">{t("noRolesAvailable")}</option>}
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name} (ID: {role.id})</option>)}
          </select>
          {selectedRole?.description && <p className="mt-2 text-xs dashboard-muted">{selectedRole.description}</p>}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border dashboard-subcard p-3"><div className="text-xl font-semibold">{permissions.length}</div><div className="mt-1 text-xs dashboard-muted">{t("systemPermissions")}</div></div>
            <div className="rounded-xl border dashboard-subcard p-3"><div className="text-xl font-semibold">{assignedIds.length}</div><div className="mt-1 text-xs dashboard-muted">{t("currentlyAssigned")}</div></div>
            <div className="rounded-xl border dashboard-subcard p-3"><div className="text-xl font-semibold text-emerald-400">{additions.length}</div><div className="mt-1 text-xs dashboard-muted">{t("toAdd")}</div></div>
            <div className="rounded-xl border dashboard-subcard p-3"><div className="text-xl font-semibold text-amber-400">{removals.length}</div><div className="mt-1 text-xs dashboard-muted">{t("toRemove")}</div></div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="button" onClick={selectAll} disabled={loadingCatalog || loadingAssigned || permissions.length === 0} className="dashboard-secondary-button inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"><CheckCheck size={14}/> {t("selectAll")}</button>
            <button type="button" onClick={clearAll} disabled={loadingAssigned || selectedIds.length === 0} className="dashboard-secondary-button inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"><X size={14}/> {t("clearAll")}</button>
            <div className="ml-auto min-w-[180px] flex-1 sm:max-w-[260px]">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPermissions")} className="dashboard-field w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-emerald-400" />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-xs font-semibold">{t("availableSystemPermissions")}</span>
              {loadingAssigned && <span className="inline-flex items-center gap-2 text-xs dashboard-muted"><LoaderCircle size={13} className="animate-spin"/> {t("loadingRoleAccess")}</span>}
            </div>
            {loadingCatalog ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm dashboard-muted"><LoaderCircle size={17} className="animate-spin"/> {t("loadingRolesPermissions")}</div>
            ) : filteredPermissions.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm dashboard-muted">{t("noPermissionsMatch")}</div>
            ) : (
              <div className="max-h-[560px] divide-y overflow-y-auto">
                {filteredPermissions.map((permission) => {
                  const checked = selectedSet.has(permission.id);
                  const originallyAssigned = assignedSet.has(permission.id);
                  return (
                    <label key={permission.id} className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]">
                      <input type="checkbox" checked={checked} onChange={() => togglePermission(permission.id)} disabled={loadingAssigned || savingPermissions} className="mt-1 h-4 w-4 accent-emerald-500"/>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {permission.name}
                          {originallyAssigned && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">{t("assigned")}</span>}
                          {!originallyAssigned && checked && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">{t("pendingAdd")}</span>}
                          {originallyAssigned && !checked && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">{t("pendingRemoval")}</span>}
                        </span>
                        <span className="mt-1 block break-all font-mono text-[11px] dashboard-muted">{permission.codename}</span>
                        {permission.content_type && <span className="mt-1 block text-[11px] dashboard-muted">{t("resource")} {permission.content_type}</span>}
                      </span>
                      <span className={checked ? "mt-0.5 text-emerald-400" : "mt-0.5 dashboard-muted"}>{checked ? <Check size={16}/> : null}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs dashboard-muted">{selectedIds.length} {t("of")} {permissions.length} {t("permissionsSelected")}</p>
            <button type="button" onClick={() => void savePermissions()} disabled={!hasChanges || savingPermissions || loadingAssigned || !assignedReady || !selectedRoleId} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
              {savingPermissions ? <LoaderCircle size={15} className="animate-spin"/> : <Save size={15}/>}
              {savingPermissions ? t("savingChanges") : t("savePermissions")}
            </button>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border dashboard-card p-5">
            <div className="flex items-center gap-2"><UserRoundPlus size={18} className="text-emerald-400"/><h2 className="font-semibold">{t("assignRoleToUser")}</h2></div>
            <p className="mt-2 text-xs dashboard-muted">{t("assignRoleDescription")}</p>
            <form onSubmit={submitUserRole} className="mt-4 space-y-3">
              <div>
                <label htmlFor="role-user-id" className="mb-1.5 block text-xs font-medium dashboard-muted">{t("userId")}</label>
                <input id="role-user-id" type="number" min="1" step="1" required value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="e.g. 1" className="dashboard-field w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-emerald-400"/>
              </div>
              <div className="rounded-xl border dashboard-subcard px-3 py-3">
                <div className="text-[11px] dashboard-muted">{t("roleToAssign")}</div>
                <div className="mt-1 text-sm font-semibold">{selectedRole?.name ?? t("selectRoleAbove")}</div>
              </div>
              <button type="submit" disabled={assigningUser || !selectedRoleId || loadingCatalog} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50">
                {assigningUser ? <LoaderCircle size={15} className="animate-spin"/> : <UserRoundPlus size={15}/>}
                {assigningUser ? t("assigning") : t("assignSelectedRole")}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border dashboard-card p-5">
            <h2 className="font-semibold">{t("howPermissionUpdatesWork")}</h2>
            <div className="mt-3 space-y-3 text-xs dashboard-muted">
              <p><span className="font-semibold text-emerald-400">{t("assigned")}</span> {t("assignedHelp")}</p>
              <p><span className="font-semibold text-blue-400">{t("pendingAdd")}</span> {t("pendingAddHelp")} <code>add_permission_ids</code>.</p>
              <p><span className="font-semibold text-amber-400">{t("pendingRemoval")}</span> {t("pendingRemoveHelp")} <code>remove_permission_ids</code>.</p>
              <p>{t("changesNotSent")} <strong className="text-slate-200">{t("savePermissions")}</strong>.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
