import { apiClient } from "@/services/api-client";
import type { UserRole, AuthUser } from "@/stores/auth-store";

export type LoginCredentials = {
  email: string;
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

function resolveUserRole(user: BackendUser, fallback: UserRole): UserRole {
  // The current API's user model exposes isAdmin instead of a role string.
  if (user.isAdmin === true || user.isAdmin === 1 || String(user.isAdmin).toLowerCase() === "true") {
    return "admin";
  }

  const roleNames = [
    ...(user.roles ?? []).map((role) => typeof role === "string" ? role : role.name ?? ""),
    user.role ?? "",
  ].map((name) => name.trim().toLowerCase().replace(/[\\s_-]+/g, ""));

  if (roleNames.some((name) => ["superadmin", "admin"].includes(name))) return "admin";
  if (roleNames.includes("agent")) return "agent";
  // Agent login is a distinct portal. The legacy backend user response often
  // labels every non-admin account as Player or omits a role, so don't let that
  // generic Player value override an Agent portal login.
  if (fallback === "agent") return "agent";
  if (roleNames.includes("player")) return "player";
  // Never grant Super Admin access based on client-selected portal alone.
  return fallback === "admin" ? "player" : fallback;
}

/**
 * Authentication service. Role routing prefers explicit API roles and recognizes
 * the current API's isAdmin flag; expectedRole is the login-entry fallback.
 */
export async function login(credentials: LoginCredentials, expectedRole: UserRole): Promise<AuthUser> {
  const response = await apiClient.post<LoginResponse>("/users/login", { phoneNumber: credentials.email.trim(), password: credentials.password });
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
  const role = resolveUserRole(user, expectedRole);
  const firstName = user.first_name?.trim() ?? "";
  const lastName = user.last_name?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    id: String(user.id ?? user._id ?? user.userId ?? user.email ?? credentials.email),
    name: user.name ?? user.fullName ?? user.full_name ?? (fullName || user.email || credentials.email),
    email: user.email ?? credentials.email,
    phone: user.phoneNumber ?? user.phone_number ?? user.phone ?? "",
    role,
  };
}

export function logout(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("token");
  }
}
