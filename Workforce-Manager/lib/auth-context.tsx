import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { apiRequest, getApiUrl, queryClient } from "@/lib/query-client";
import { fetch } from "expo/fetch";

interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: "admin" | "supervisor" | "labor";
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/me", baseUrl);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    const data = await res.json();
    setUser(data);
    // Clear all cached queries to ensure fresh data for new user
    queryClient.clear();
  }

  async function logout() {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {
    }
    setUser(null);
    // Clear all cached queries on logout
    queryClient.clear();
  }

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
