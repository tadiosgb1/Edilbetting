"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, CheckCheck, LoaderCircle, RefreshCw, Save, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useLanguage } from "@/components/language-provider";
import { getApiErrorMessage } from "@/services/api-client";
import {
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
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [assignedReady, setAssignedReady] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
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


  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="management-breadcrumb"><Link href="../users">Users</Link><span aria-hidden="true">/</span><Link href="../roles">Roles</Link><span aria-hidden="true">/</span><Link href="../permissions" aria-current="page">Permissions</Link></nav>
      <div className="management-page-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold md:text-2xl">{t("permissions")}</h1>
          <button type="button" onClick={() => void loadCatalog()} disabled={loadingCatalog} className="dashboard-secondary-button inline-flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50">
            <RefreshCw size={15} className={loadingCatalog ? "animate-spin" : ""} /> {t("refresh")}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="permission-workspace grid gap-3 border p-3 sm:p-4">
        <div className="space-y-3">
          <label htmlFor="permission-role" className="mb-1.5 block text-xs font-medium dashboard-muted">{t("selectRole")}</label>
          <select id="permission-role" value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)} disabled={loadingCatalog || roles.length === 0} className="management-select dashboard-field w-full px-3 py-2.5 text-sm outline-none focus:border-emerald-400">
            {roles.length === 0 && <option value="">{t("noRolesAvailable")}</option>}
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name} (ID: {role.id})</option>)}
          </select>
          {selectedRole?.description && <p className="mt-2 text-xs dashboard-muted">{selectedRole.description}</p>}

          <div className="permission-summary-grid mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="dashboard-subcard px-3 py-2"><div className="text-lg font-semibold leading-5">{permissions.length}</div><div className="mt-0.5 text-[11px] dashboard-muted">{t("systemPermissions")}</div></div>
            <div className="dashboard-subcard border p-3"><div className="text-xl font-semibold">{assignedIds.length}</div><div className="mt-1 text-xs dashboard-muted">{t("currentlyAssigned")}</div></div>
            <div className="dashboard-subcard rounded-lg px-3 py-2"><div className="text-lg font-semibold leading-5 text-emerald-600">{additions.length}</div><div className="mt-1 text-xs dashboard-muted">{t("toAdd")}</div></div>
            <div className="dashboard-subcard rounded-lg px-3 py-2"><div className="text-lg font-semibold leading-5 text-amber-600">{removals.length}</div><div className="mt-1 text-xs dashboard-muted">{t("toRemove")}</div></div>
          </div>

          <div className="permission-toolbar mt-4 flex flex-wrap items-center gap-2 border p-2.5">
            <button type="button" onClick={selectAll} disabled={loadingCatalog || loadingAssigned || permissions.length === 0} className="dashboard-secondary-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50"><CheckCheck size={14}/> {t("selectAll")}</button>
            <button type="button" onClick={clearAll} disabled={loadingAssigned || selectedIds.length === 0} className="dashboard-secondary-button inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"><X size={14}/> {t("clearAll")}</button>
            <div className="ml-auto min-w-[180px] flex-1 sm:max-w-[260px]">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPermissions")} className="dashboard-field w-full rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-400" />
            </div>
          </div>

          <div className="permission-list mt-3 overflow-hidden border">
            <div className="permission-list-header flex items-center justify-between px-3 py-2.5">
              <span className="text-xs font-semibold">{t("availableSystemPermissions")}</span>
              {loadingAssigned && <span className="inline-flex items-center gap-2 text-xs dashboard-muted"><LoaderCircle size={13} className="animate-spin"/> {t("loadingRoleAccess")}</span>}
            </div>
            {loadingCatalog ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm dashboard-muted"><LoaderCircle size={17} className="animate-spin"/> {t("loadingRolesPermissions")}</div>
            ) : filteredPermissions.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm dashboard-muted">{t("noPermissionsMatch")}</div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto">
                {filteredPermissions.map((permission) => {
                  const checked = selectedSet.has(permission.id);
                  const originallyAssigned = assignedSet.has(permission.id);
                  return (
                    <label key={permission.id} className="permission-list-row flex cursor-pointer items-start gap-3 border-b px-3 py-2 transition-colors last:border-0">
                      <input type="checkbox" checked={checked} onChange={() => togglePermission(permission.id)} disabled={loadingAssigned || savingPermissions} className="mt-0.5 h-4 w-4 accent-[var(--brand)]"/>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {permission.name}
                          {originallyAssigned && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">{t("assigned")}</span>}
                          {!originallyAssigned && checked && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">{t("pendingAdd")}</span>}
                          {originallyAssigned && !checked && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">{t("pendingRemoval")}</span>}
                        </span>
                        <span className="mt-1 block break-all font-mono text-[11px] dashboard-muted">{permission.codename}</span>
                        {permission.content_type && <span className="mt-1 block text-[11px] dashboard-muted">{t("resource")} {permission.content_type}</span>}
                      </span>
                      <span className={checked ? "mt-0.5 text-emerald-600" : "mt-0.5 dashboard-muted"}>{checked ? <Check size={16}/> : null}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs dashboard-muted">{selectedIds.length} {t("of")} {permissions.length} {t("permissionsSelected")}</p>
            <button type="button" onClick={() => void savePermissions()} disabled={!hasChanges || savingPermissions || loadingAssigned || !assignedReady || !selectedRoleId} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
              {savingPermissions ? <LoaderCircle size={15} className="animate-spin"/> : <Save size={15}/>}
              {savingPermissions ? t("savingChanges") : t("savePermissions")}
            </button>
          </div>
        </div>

      </section>
    </div>
  );
}
