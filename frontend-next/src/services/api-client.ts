import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn("NEXT_PUBLIC_API_BASE_URL is not configured. Copy .env.example to .env.local.");
}

/**
 * Shared Axios instance for all frontend API services.
 * Keep endpoint paths relative (for example, /users/login) so the base URL
 * remains configurable per environment.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL || "https://10.195.49.21:3001",
  timeout: 20_000,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

const ACCESS_TOKEN_KEY = "edilbet-access-token";

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export type ApiError = AxiosError<{ message?: string; error?: string }>;
