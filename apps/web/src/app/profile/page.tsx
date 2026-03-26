'use client';

import { useState, type FormEvent } from 'react';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

export default function ProfilePage() {
  const { user, token, setAuth } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const updated = await apiRequest<{ firstName: string; lastName: string }>(
        '/api/auth/profile',
        { method: 'PATCH', body: JSON.stringify({ firstName, lastName }) },
        token,
      );
      if (user) {
        setAuth({ ...user, firstName: updated.firstName, lastName: updated.lastName }, token!);
      }
      setMessage('Профиль обновлён');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage('Пароль должен быть минимум 6 символов');
      return;
    }
    setSavingPassword(true);
    setPasswordMessage('');
    try {
      await apiRequest(
        '/api/auth/password',
        { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) },
        token,
      );
      setPasswordMessage('Пароль изменён');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMessage(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <AuthGuard>
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-6 max-w-xl">
          <h1 className="mb-6 text-2xl font-bold text-white">Профиль</h1>

          {/* Profile info */}
          <form onSubmit={handleProfileSubmit} className="rounded-xl border border-dark-border bg-dark-card p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Личные данные</h2>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-zinc-400">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-sm text-zinc-500"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-zinc-400">Имя</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm text-zinc-400">Фамилия</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
              />
            </div>

            {message && <p className="mb-3 text-sm text-green-400">{message}</p>}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand px-6 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>

          {/* Password change */}
          <form onSubmit={handlePasswordSubmit} className="rounded-xl border border-dark-border bg-dark-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Сменить пароль</h2>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-zinc-400">Текущий пароль</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm text-zinc-400">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
              />
            </div>

            {passwordMessage && (
              <p className={`mb-3 text-sm ${passwordMessage.includes('Ошибка') ? 'text-red-400' : 'text-green-400'}`}>
                {passwordMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-lg bg-brand px-6 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              {savingPassword ? 'Сохранение...' : 'Сменить пароль'}
            </button>
          </form>
        </main>
      </div>
    </AuthGuard>
  );
}
