import { useState, useEffect } from 'react';
import { apiRequest, setAuthToken } from '../lib/api';

interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export function useTelegramAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function authenticate(): Promise<void> {
      const tg = window.Telegram?.WebApp;
      if (!tg?.initData) {
        setState({ user: null, loading: false, error: 'Not running in Telegram' });
        return;
      }

      try {
        tg.ready();
        tg.expand();

        const result = await apiRequest<{ user: AuthUser; accessToken: string }>(
          '/api/auth/telegram',
          {
            method: 'POST',
            body: JSON.stringify({ initData: tg.initData }),
          },
        );

        setAuthToken(result.accessToken);
        setState({ user: result.user, loading: false, error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setState({ user: null, loading: false, error: message });
      }
    }

    authenticate();
  }, []);

  return state;
}
