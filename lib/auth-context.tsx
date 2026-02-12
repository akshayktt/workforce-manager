import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { apiRequest, getApiUrl, queryClient, resetAuthCache } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: "admin" | "supervisor" | "labor";
  token?: string;
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

  // Clear all cached authentication data
  async function clearAllCache() {
    try {
      // Use the comprehensive reset function
      await resetAuthCache();
      // Clear user state
      setUser(null);
      console.log('[Auth] Cleared all authentication cache');
    } catch (e) {
      console.warn('[Auth] Failed to clear some cache:', e);
    }
  }

  useEffect(() => {
    // Clear cache on app start to prevent stale data issues
    clearAllCache().then(() => {
      checkAuth();
    });
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
    try {
      console.log('[Auth] Login attempt for username:', username);
      
      // Clear any existing cached data before login attempt
      await clearAllCache();
      console.log('[Auth] Cache cleared before login');
      
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      console.log('[Auth] API request response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log('[Auth] Login failed with error text:', errorText);
        let errorMessage = 'Login failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        // Clear cache on login failure
        await clearAllCache();
        console.log('[Auth] Throwing error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      console.log('[Auth] Login successful - Full response data:', JSON.stringify(data, null, 2));
      console.log('[Auth] User data:', data.username, data.role, data.id);
      
      // Store JWT token if returned (production)
      if (data.token) {
        console.log('[Auth] Storing JWT token:', data.token.substring(0, 20) + '...');
        await AsyncStorage.setItem('jwt_token', data.token);
        console.log('[Auth] JWT token stored successfully');
      }
      
      console.log('[Auth] Setting user data in context');
      setUser(data);
      console.log('[Auth] User data set, clearing query cache');
      // Clear React Query cache to ensure fresh data for new user
      queryClient.clear();
      console.log('[Auth] Login process completed successfully');
    } catch (error) {
      console.error('[Auth] Login error details:', error);
      console.error('[Auth] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // Ensure cache is cleared on any error
      await clearAllCache();
      console.log('[Auth] Cache cleared after error');
      throw error; // Re-throw so UI can handle it
    }
  }

  async function logout() {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {
    }
    
    // Clear all authentication data on logout
    await clearAllCache();
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
