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
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? { email, password, firstName: firstName || undefined }
        : { email, password };

      const data = await apiRequest<AuthResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
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
    <div className="flex min-h-screen items-center justify-center px-4 bg-[#0A0A0B]">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-white">
          LMS Platform
        </Link>

        <div className="rounded-2xl border border-dark-border bg-dark-card p-8">
          <h1 className="mb-6 text-xl font-bold text-center text-white">
            {isRegister ? 'Регистрация' : 'Вход'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Имя</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                  placeholder="Ваше имя"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-zinc-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-400">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                placeholder="Минимум 6 символов"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              {loading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-zinc-500">
            {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-brand hover:underline"
            >
              {isRegister ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
