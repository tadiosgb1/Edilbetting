import { apiClient } from "@/services/api-client";
import { useAuthStore, type UserRole, type AuthUser } from "@/stores/auth-store";

export type LoginCredentials = {
  phone_number: string;
  password: string;
};

type BackendRole = { name?: string; role?: string; role_name?: string } | string;
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
  role?: BackendRole;
  roles?: BackendRole[] | BackendRole;
  isAdmin?: boolean | string | number;
};

type LoginResponse = {
  status?: string;
  data?: {
    access_token?: string;
    accessToken?: string;
    token?: string;
    user?: BackendUser;
  };
  user?: BackendUser;
  access_token?: string;
  accessToken?: string;
  token?: string;
  message?: string;
};

const normalizeRoleName = (role: BackendRole | undefined): string => {
  const name = typeof role === "string" ? role : role?.name ?? role?.role ?? role?.role_name ?? "";
  return String(name).trim().toLowerCase().replace(/[\s_-]+/g, "");
};

export function resolveUserRole(user: BackendUser): UserRole {
  const backendRoles = Array.isArray(user.roles) ? user.roles : user.roles ? [user.roles] : [];
  const roleNames = [...backendRoles, user.role].map(normalizeRoleName).filter(Boolean);

  // Admin takes priority if the account has multiple roles.
  if (
    user.isAdmin === true ||
    user.isAdmin === 1 ||
    String(user.isAdmin).trim().toLowerCase() === "true" ||
    String(user.isAdmin).trim() === "1" ||
    roleNames.some((name) => ["admin", "administrator", "superadmin", "superadministrator", "superuser"].includes(name))
  ) return "admin";

  if (roleNames.includes("agent")) return "agent";
  if (roleNames.includes("player")) return "player";
  return "player";
}

export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const response = await apiClient.post<LoginResponse>("/users/login", {
    phone_number: credentials.phone_number.trim(),
    password: credentials.password,
  });

  // Production API shape: { status, data: { access_token, user } }
  const payload = response.data;
  const user = payload.data?.user ?? payload.user;
  if (!user || typeof user !== "object") {
    throw new Error("Login succeeded but the API response did not include a user.");
  }

  const accessToken = payload.data?.access_token ?? payload.data?.accessToken ?? payload.data?.token ??
    payload.access_token ?? payload.accessToken ?? payload.token;
  if (accessToken && typeof window !== "undefined") {
    window.localStorage.setItem("token", accessToken);
  }

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
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("edilbet-logout-in-progress");
  window.localStorage.removeItem("token");
  useAuthStore.getState().clearUser();
}
