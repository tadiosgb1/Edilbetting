import { apiClient } from "@/services/api-client";

export type SystemPermission = {
  id: number;
  name: string;
  codename: string;
  content_type?: string;
  created_at?: string;
};

export type SystemRole = {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
};

type PaginatedResponse<T> = {
  status?: string;
  count?: number;
  total_pages?: number;
  current_page?: number;
  data?: T[];
};

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.permissions)) return record.permissions as T[];
    if (record.data && typeof record.data === "object") {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.permissions)) return nested.permissions as T[];
      if (Array.isArray(nested.data)) return nested.data as T[];
    }
  }
  return [];
}

async function getAllPages<T>(path: string): Promise<T[]> {
  const firstResponse = await apiClient.get<PaginatedResponse<T> | T[]>(path);
  const firstPayload = firstResponse.data;
  const firstItems = asArray<T>(firstPayload);
  const totalPages =
    firstPayload && !Array.isArray(firstPayload) && typeof firstPayload === "object"
      ? Math.max(1, Number((firstPayload as PaginatedResponse<T>).total_pages) || 1)
      : 1;

  if (totalPages <= 1) return firstItems;

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      apiClient.get<PaginatedResponse<T> | T[]>(path, { params: { page: index + 2 } }),
    ),
  );
  return firstItems.concat(...remaining.map((response) => asArray<T>(response.data)));
}

export async function getSystemPermissions(): Promise<SystemPermission[]> {
  return getAllPages<SystemPermission>("/permissions");
}

export async function getSystemRoles(): Promise<SystemRole[]> {
  return getAllPages<SystemRole>("/roles");
}

export async function getRolePermissions(roleId: number): Promise<SystemPermission[]> {
  const response = await apiClient.get<unknown>(`/role-permissions/role/${roleId}/permissions`);
  const items = asArray<unknown>(response.data);
  return items.map((item) => {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const permission = (record.permission && typeof record.permission === "object"
      ? record.permission
      : record) as Record<string, unknown>;
    const id = Number(permission.id ?? record.permission_id ?? record.id);
    if (!Number.isFinite(id)) return null;
    return {
      id,
      name: String(permission.name ?? record.name ?? `Permission ${id}`),
      codename: String(permission.codename ?? record.codename ?? ""),
      content_type: typeof permission.content_type === "string" ? permission.content_type : undefined,
      created_at: typeof permission.created_at === "string" ? permission.created_at : undefined,
    };
  }).filter((permission): permission is SystemPermission => permission !== null);
}

export async function assignUserRole(userId: number, roleId: number): Promise<void> {
  await apiClient.post("/user-roles", { user_id: userId, role_id: roleId });
}

export async function manageRolePermissions(
  roleId: number,
  addPermissionIds: number[],
  removePermissionIds: number[],
): Promise<void> {
  await apiClient.post("/role-permissions/manage", {
    role_id: roleId,
    add_permission_ids: addPermissionIds,
    remove_permission_ids: removePermissionIds,
  });
}
