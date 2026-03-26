'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

interface AuthResponse {
  user: { id: string; email: string | null; firstName: string | null; lastName: string | null; role: string };
  accessToken: string;
  refreshToken: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const setAuth = useAuthStore(s => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-foreground">
          AiBot
        </Link>

        <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8">
          <h1 className="mb-6 text-xl font-bold text-center text-foreground">{t('auth.login')}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('auth.email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-border/50 bg-secondary/50 backdrop-blur-sm px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-orange-500/50 focus:outline-none placeholder:text-muted-foreground/70"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('auth.password')}</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-border/50 bg-secondary/50 backdrop-blur-sm px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-orange-500/50 focus:outline-none placeholder:text-muted-foreground/70"
                placeholder={t('auth.enterPassword')}
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 disabled:opacity-50 transition-all"
            >
              {loading ? t('auth.loading') : t('auth.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
