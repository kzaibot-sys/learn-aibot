'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

interface AuthResponse {
  user: { id: string; email: string | null; firstName: string | null; lastName: string | null; role: string };
  accessToken: string;
}

export default function LoginPage() {
  const router = useRouter();
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

      setAuth(data.user, data.accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-foreground">
          LearnHub Pro
        </Link>

        <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8">
          <h1 className="mb-6 text-xl font-bold text-center text-foreground">Вход</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-border/50 bg-secondary/50 backdrop-blur-sm px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/70"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-border/50 bg-secondary/50 backdrop-blur-sm px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/70"
                placeholder="Введите пароль"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-primary via-accent to-orange-400 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 disabled:opacity-50 transition-all"
            >
              {loading ? 'Загрузка...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
