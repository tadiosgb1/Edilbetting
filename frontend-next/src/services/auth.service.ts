import { apiClient } from "@/services/api-client";
import type { UserRole, AuthUser } from "@/stores/auth-store";

export type LoginCredentials = {
  email: string;
  password: string;
};

type BackendUser = {
  id?: string | number;
  _id?: string | number;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
};

type LoginResponse = {
  user?: BackendUser;
  data?: BackendUser & { user?: BackendUser; accessToken?: string; token?: string };
  accessToken?: string;
  token?: string;
  message?: string;
};

/**
 * Authentication service. Components should call this service rather than
 * knowing backend URLs, Axios details, or response parsing rules.
 */
export async function login(credentials: LoginCredentials, expectedRole: UserRole): Promise<AuthUser> {
  const response = await apiClient.post<LoginResponse>("/users/login", credentials);
  const payload = response.data;
  const user = payload.user ?? payload.data?.user ?? payload.data ?? (payload as unknown as BackendUser);

  const roleValue = user.role?.toLowerCase();
  const role: UserRole =
    roleValue === "admin" || roleValue === "agent" || roleValue === "player"
      ? roleValue
      : expectedRole;

  return {
    id: String(user.id ?? user._id ?? user.email ?? credentials.email),
    name: user.name ?? user.fullName ?? credentials.email,
    email: user.email ?? credentials.email,
    // Retain the legacy field while other profile screens migrate to email.
    phone: "",
    role,
  };
}

export function logout(): void {
  // Authentication is managed by the backend session cookie (withCredentials).
}
