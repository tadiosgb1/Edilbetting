import { apiClient } from "./api-client";
import type { UserRole } from "@/stores/auth-store";

export type LoginPayload = { phone: string; password: string; role: UserRole };
export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post("/auth/login", payload);
    return data;
  },
  async register(payload: { phone: string; password: string; name: string; role: UserRole }) {
    const { data } = await apiClient.post("/auth/register", payload);
    return data;
  },
  async logout() {
    await apiClient.post("/auth/logout");
  },
  async me() {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },
};
