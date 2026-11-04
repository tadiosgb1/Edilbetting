"use client";

import { useCallback, useState } from "react";
import type { AxiosRequestConfig } from "axios";
import { apiClient, getApiErrorMessage } from "@/services/api-client";

type ApiState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

/**
 * Generic request hook for client components.
 * Supply a request function so the hook can be reused with any service,
 * endpoint, HTTP method, and response type.
 */
export function useApi<TData, TArgs extends unknown[] = []>(
  request: (...args: TArgs) => Promise<TData>,
) {
  const [state, setState] = useState<ApiState<TData>>({
    data: null,
    error: null,
    loading: false,
  });

  const execute = useCallback(async (...args: TArgs): Promise<TData> => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await request(...args);
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      setState((current) => ({ ...current, error: message, loading: false }));
      throw error;
    }
  }, [request]);

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false });
  }, []);

  return { ...state, execute, reset };
}

/** Convenience helper for typed requests outside React components. */
export function apiRequest<TResponse>(config: AxiosRequestConfig): Promise<TResponse> {
  return apiClient.request<TResponse>(config).then((response) => response.data);
}
