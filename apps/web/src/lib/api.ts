import { useAuthStore } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const { refreshToken, setAuth, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      logout();
      return false;
    }

    setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
    return true;
  } catch {
    logout();
    return false;
  }
}

async function refreshTokenIfNeeded(): Promise<boolean> {
  // Prevent concurrent refresh requests
  if (refreshPromise) return refreshPromise;
  refreshPromise = tryRefreshToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const authToken = token ?? useAuthStore.getState().token;
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // On 401, attempt token refresh and retry once
  if (response.status === 401 && authToken) {
    const refreshed = await refreshTokenIfNeeded();
    if (refreshed) {
      const newToken = useAuthStore.getState().token;
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });
      const retryData = await retryResponse.json();
      if (!retryResponse.ok || !retryData.success) {
        throw new Error(retryData.error?.message || 'Request failed');
      }
      return retryData.data as T;
    }
    throw new Error('Session expired');
  }

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data.data as T;
}
