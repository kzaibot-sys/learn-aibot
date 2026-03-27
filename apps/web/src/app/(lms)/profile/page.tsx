'use client';

import { useState, type FormEvent } from 'react';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';
import { Info } from 'lucide-react';

export default function ProfilePage() {
  const { t } = useI18n();
  const { user, token, refreshToken, setAuth } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [middleName, setMiddleName] = useState(user?.middleName || '');
  const [phone, setPhone] = useState(user?.phone || '');
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
      const updated = await apiRequest<{ firstName: string; lastName: string; middleName: string; phone: string }>(
        '/api/auth/profile',
        { method: 'PATCH', body: JSON.stringify({ firstName, lastName, middleName, phone }) },
        token,
      );
      if (user) {
        setAuth(
          { ...user, firstName: updated.firstName, lastName: updated.lastName, middleName: updated.middleName || null, phone: updated.phone || null },
          token!,
          refreshToken!,
        );
      }
      setMessage(t('profile.updated'));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage(t('profile.passwordMinLength'));
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
      setPasswordMessage(t('profile.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMessage(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto animate-fade-in-up">
          <h1 className="mb-6 text-2xl font-bold text-foreground">{t('profile.title')}</h1>

          {/* Profile info */}
          <form onSubmit={handleProfileSubmit} className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">{t('profile.personalInfo')}</h2>

            {/* Certificate note */}
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 p-3">
              <Info className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t('profile.certNote')}
              </p>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-muted-foreground"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mb-3">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">{t('profile.lastName')} *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">{t('profile.firstName')} *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mb-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">{t('profile.middleName')}</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={e => setMiddleName(e.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">{t('profile.phone')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            {message && <p className="mb-3 text-sm text-green-400">{message}</p>}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-6 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 transition-all"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </form>

          {/* Password change */}
          <form onSubmit={handlePasswordSubmit} className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">{t('profile.changePassword')}</h2>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-muted-foreground">{t('profile.currentPassword')}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm text-muted-foreground">{t('profile.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {passwordMessage && (
              <p className={`mb-3 text-sm ${passwordMessage.includes(t('common.error')) ? 'text-red-400' : 'text-green-400'}`}>
                {passwordMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-lg bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-6 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 transition-all"
            >
              {savingPassword ? t('common.saving') : t('profile.changePassword')}
            </button>
          </form>
    </div>
  );
}
