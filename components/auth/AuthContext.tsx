"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { getMe } from "@/services/user.service";
import type { AuthStatus } from "@/types/auth";
import type { CurrentUser } from "@/types/user";

interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUser | null;
  refresh: () => Promise<void>;
  setUser: (user: CurrentUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStatusFromUser(user: CurrentUser): AuthStatus {
  if (user.status === "blocked" || user.status === "suspended" || !user.isActive) {
    return "blocked";
  }

  if (user.status === "pending_verification" || user.isVerified === false) {
    return "pending_verification";
  }

  return "authenticated";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("unknown");
  const [user, setUser] = useState<CurrentUser | null>(null);

  const refresh = useCallback(async () => {
    setStatus("unknown");

    try {
      const currentUser = await getMe();
      setUser(currentUser);
      setStatus(getStatusFromUser(currentUser));
    } catch {
      setUser(null);
      setStatus("guest");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      status,
      user,
      refresh,
      setUser,
    }),
    [refresh, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
