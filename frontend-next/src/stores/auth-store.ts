"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserRole = "player" | "agent" | "admin";
export type AuthUser = { id: string; name: string; phone: string; role: UserRole };
export type LocalAccount = { phone: string; name: string; role: UserRole; passwordHash: string };
type AuthState = {
  user: AuthUser | null;
  accounts: LocalAccount[];
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
  addAccount: (account: LocalAccount) => boolean;
};

export const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

export async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: [],
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      addAccount: (account) => {
        const phone = normalizePhone(account.phone);
        if (!phone || get().accounts.some((item) => normalizePhone(item.phone) === phone)) return false;
        set((state) => ({ accounts: [...state.accounts, { ...account, phone }] }));
        return true;
      },
    }),
    {
      name: "edilbet-auth",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ user: state.user, accounts: state.accounts }) as AuthState,
    },
  ),
);
