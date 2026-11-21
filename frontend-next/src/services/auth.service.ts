import { apiClient } from "@/services/api-client";
import type { UserRole, AuthUser } from "@/stores/auth-store";

export type LoginCredentials = {
  phone_number: string;
  password: string;
};

type BackendRole = { name?: string } | string;
type BackendUser = {
  id?: string | number;
  _id?: string | number;
  userId?: string | number;
  name?: string;
  fullName?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phoneNumber?: string;
  phone_number?: string;
  phone?: string;
  role?: string;
  roles?: BackendRole[];
  isAdmin?: boolean | string | number;
};

type LoginResponse = {
  user?: BackendUser;
  data?: BackendUser & {
    user?: BackendUser;
    access_token?: string;
    accessToken?: string;
    token?: string;
  };
  access_token?: string;
  accessToken?: string;
  token?: string;
  message?: string;
};

function resolveUserRole(user: BackendUser): UserRole {
  if (user.isAdmin === true || user.isAdmin === 1 || String(user.isAdmin).toLowerCase() === "true") {
    return "admin";
  }

  const roleNames = [
    ...(user.roles ?? []).map((role) => typeof role === "string" ? role : role.name ?? ""),
    user.role ?? "",
  ].map((name) => name.trim().toLowerCase().replace(/[\s_-]+/g, ""));

  // Backend role is authoritative. Portal selection must never override it.
  if (roleNames.includes("superadmin") || roleNames.includes("superuser") || roleNames.includes("admin") || roleNames.includes("administrator")) return "admin";
  if (roleNames.includes("agent")) return "agent";
  if (roleNames.includes("player")) return "player";

  // Unknown or non-portal roles fall back to the public/player home.
  return "player";
}
/**
 * Authentication service. Role routing prefers explicit API roles and recognizes
 * the current API's isAdmin flag; expectedRole is the login-entry fallback.
 */
export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const response = await apiClient.post<LoginResponse>("/users/login", { phone_number: credentials.phone_number.trim(), password: credentials.password });
  const payload = response.data;
  const accessToken =
    payload.data?.access_token ??
    payload.data?.accessToken ??
    payload.data?.token ??
    payload.access_token ??
    payload.accessToken ??
    payload.token;

  if (accessToken && typeof window !== "undefined") {
    window.localStorage.setItem("token", accessToken);
  }

  const user = payload.data?.user ?? payload.user ?? payload.data ?? (payload as unknown as BackendUser);
  const role = resolveUserRole(user);
  const firstName = user.first_name?.trim() ?? "";
  const lastName = user.last_name?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    id: String(user.id ?? user._id ?? user.userId ?? user.email ?? credentials.phone_number),
    name: user.name ?? user.fullName ?? user.full_name ?? (fullName || user.email || credentials.phone_number),
    email: user.email ?? "",
    phone: user.phoneNumber ?? user.phone_number ?? user.phone ?? "",
    role,
  };
}

export function logout(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("token");
  }
}
