import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Gets the base URL for the Express API server (e.g., "http://localhost:5000")
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // In web environment, use current location
  if (typeof window !== 'undefined') {
    // Development: use Express server on port 4000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
    // Production: use current domain  
    return window.location.origin;
  }
  
  // Fallback to environment variable
  let host = process.env.EXPO_PUBLIC_DOMAIN;
  if (!host) {
    // Default for development
    host = "localhost:4000";
  }

  // Use http for localhost/127.0.0.1, https for other domains
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  let url = new URL(`${protocol}://${host}`);
  return url.href;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getSessionCookie(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("session_cookie");
  } catch (e) {
    console.warn("Failed to get session cookie from storage", e);
    return null;
  }
}

async function setSessionCookie(cookie: string): Promise<void> {
  try {
    await AsyncStorage.setItem("session_cookie", cookie);
  } catch (e) {
    console.warn("Failed to store session cookie", e);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Check if we're in production (non-localhost)
  const isProduction = !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1');
  
  if (isProduction) {
    // Production: use JWT token
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to get JWT token:', e);
    }
  } else {
    // Development: use session cookies
    const storedCookie = await getSessionCookie();
    if (storedCookie) {
      headers.Cookie = storedCookie;
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If we got a Set-Cookie header, store it
  const setCookie = res.headers.get("Set-Cookie");
  if (setCookie) {
    // Extract just the connect.sid part
    const sessionMatch = setCookie.match(/connect\.sid=[^;]+/);
    if (sessionMatch) {
      await setSessionCookie(sessionMatch[0]);
    }
  }

  // Only throw if not ok - caller will handle response.json()
  if (!res.ok) {
    // Try to get error message from response
    let errorMessage = res.statusText;
    try {
      const errorBody = await res.text();
      if (errorBody) {
        try {
          const parsed = JSON.parse(errorBody);
          errorMessage = parsed.message || errorBody;
        } catch {
          errorMessage = errorBody;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const headers: Record<string, string> = {};

    // Check if we're in production
    const isProduction = !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1');
    
    if (isProduction) {
      // Production: use JWT token
      try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.warn('Failed to get JWT token:', e);
      }
    } else {
      // Development: use session cookies
      const storedCookie = await getSessionCookie();
      if (storedCookie) {
        headers.Cookie = storedCookie;
      }
    }

    const res = await fetch(url.toString(), {
      credentials: "include",
      headers,
    });

    // If we got a Set-Cookie header, store it
    const setCookie = res.headers.get("Set-Cookie");
    if (setCookie) {
      // Extract just the connect.sid part
      const sessionMatch = setCookie.match(/connect\.sid=[^;]+/);
      if (sessionMatch) {
        await setSessionCookie(sessionMatch[0]);
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Changed from Infinity to 0 to prevent stale data issues
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Function to completely reset authentication cache
export async function resetAuthCache() {
  try {
    // Clear all queries
    queryClient.clear();
    // Remove all cached data
    queryClient.removeQueries();
    // Reset cache
    queryClient.resetQueries();
    // Clear stored tokens
    await AsyncStorage.removeItem('jwt_token');
    await AsyncStorage.removeItem('session_cookie');
    
    // Web-specific cache clearing
    if (typeof window !== 'undefined') {
      // Clear any localStorage items
      try {
        window.localStorage.removeItem('jwt_token');
        window.localStorage.removeItem('session_cookie');
      } catch (e) {
        console.warn('[Cache] localStorage not available:', e);
      }
      
      // Clear any sessionStorage items  
      try {
        window.sessionStorage.removeItem('jwt_token');
        window.sessionStorage.removeItem('session_cookie');
      } catch (e) {
        console.warn('[Cache] sessionStorage not available:', e);
      }
    }
    
    console.log('[QueryClient] Authentication cache completely reset');
  } catch (error) {
    console.warn('[QueryClient] Failed to reset auth cache:', error);
  }
}
