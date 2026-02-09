import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Gets the base URL for the Express API server (e.g., "http://localhost:5000")
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set");
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

  // Try to get session cookie from storage (for web compatibility)
  const storedCookie = await getSessionCookie();
  if (storedCookie) {
    headers.Cookie = storedCookie;
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

    // Try to get session cookie from storage (for web compatibility)
    const storedCookie = await getSessionCookie();
    if (storedCookie) {
      headers.Cookie = storedCookie;
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
