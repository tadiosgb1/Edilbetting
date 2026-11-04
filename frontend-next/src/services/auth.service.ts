import { apiClient, setAccessToken } from "@/services/api-client";
import type { UserRole, AuthUser } from "@/stores/auth-store";

export type LoginCredentials = {
  phone: string;
  password: string;
};

type BackendUser = {
  id?: string | number;
  _id?: string | number;
  name?: string;
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  role?: string;
};

type LoginResponse = {
  user?: BackendUser;
  data?: { user?: BackendUser; accessToken?: string; token?: string };
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
  const user = payload.user ?? payload.data?.user ?? (payload as unknown as BackendUser);
  const token = payload.accessToken ?? payload.token ?? payload.data?.accessToken ?? payload.data?.token;

  if (token) setAccessToken(token);

  const roleValue = user.role?.toLowerCase();
  const role: UserRole =
    roleValue === "admin" || roleValue === "agent" || roleValue === "player"
      ? roleValue
      : expectedRole;

  return {
    id: String(user.id ?? user._id ?? user.phone ?? credentials.phone),
    name: user.name ?? user.fullName ?? credentials.phone,
    phone: user.phone ?? user.phoneNumber ?? credentials.phone,
    role,
  };
}

export function logout(): void {
  setAccessToken(null);
}
