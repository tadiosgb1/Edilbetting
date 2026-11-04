import { apiClient } from "@/services/api-client";
import type { SystemRole } from "@/services/permission.service";

export type RoleInput = { name: string; description: string };
export type ManagedUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role_id?: number;
  role?: { id?: number; name?: string } | string;
  created_at?: string;
};
export type UserInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password?: string;
  role_id: number;
};

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const value = payload as Record<string, unknown>;
  if (Array.isArray(value.data)) return value.data as T[];
  if (Array.isArray(value.users)) return value.users as T[];
  if (Array.isArray(value.roles)) return value.roles as T[];
  return [];
}

async function getAll<T>(path: string): Promise<T[]> {
  const first = await apiClient.get<unknown>(path);
  const items = unwrapList<T>(first.data);
  const root = first.data && typeof first.data === "object" ? first.data as Record<string, unknown> : {};
  const pages = Math.max(1, Number(root.total_pages) || 1);
  if (pages === 1) return items;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) =>
    apiClient.get<unknown>(path, { params: { page: i + 2 } }),
  ));
  return items.concat(...rest.map((response) => unwrapList<T>(response.data)));
}

export const listRoles = () => getAll<SystemRole>("/roles");
export async function createRole(payload: RoleInput) {
  return apiClient.post("/roles", payload);
}
export async function updateRole(id: number, payload: Partial<RoleInput>) {
  return apiClient.patch(`/roles/${id}`, payload);
}
export async function deleteRole(id: number) {
  return apiClient.delete(`/roles/${id}`);
}

export const listUsers = () => getAll<ManagedUser>("/users");
export async function createUser(payload: UserInput) {
  return apiClient.post("/users", payload);
}
export async function updateUser(id: number, payload: Partial<UserInput>) {
  const { password, ...fields } = payload;
  const body = password ? payload : fields;
  return apiClient.patch(`/users/${id}`, body);
}
export async function deleteUser(id: number) {
  return apiClient.delete(`/users/${id}`);
}

export type UserPage = {
  data: ManagedUser[];
  count: number;
  totalPages: number;
  currentPage: number;
};

export async function listUsersPage(page: number, search: string): Promise<UserPage> {
  const response = await apiClient.get<unknown>("/users", {
    params: { page, ...(search.trim() ? { search: search.trim() } : {}) },
  });
  const payload = response.data && typeof response.data === "object"
    ? response.data as Record<string, unknown>
    : {};
  const rows = unwrapList<ManagedUser>(payload);
  return {
    data: rows,
    count: Number(payload.count ?? payload.total ?? rows.length),
    totalPages: Math.max(1, Number(payload.total_pages ?? payload.totalPages) || 1),
    currentPage: Math.max(1, Number(payload.current_page ?? payload.currentPage) || page),
  };
}

export async function assignUserRole(userId: number, roleId: number) {
  return apiClient.post("/user-roles", { user_id: userId, role_id: roleId });
}
