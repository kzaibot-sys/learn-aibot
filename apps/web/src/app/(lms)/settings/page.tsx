'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Moon,
  Sun,
  Globe,
  Bell,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme';

/* ---------- animation ---------- */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ---------- component ---------- */

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { t, locale, setLocale } = useI18n();
  const { dark: darkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  function toggleLocale() {
    setLocale(locale === 'ru' ? 'kz' : 'ru');
  }

  return (
    <div className="space-y-8 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-bold text-foreground mb-1">{t('settings.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('settings.subtitle')}
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-6"
            >
              {/* Account Section */}
              <motion.div
                variants={fadeUp}
                custom={0}
                className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 space-y-5"
              >
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {t('settings.account')}
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-500/10">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t('settings.name')}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.firstName || t('settings.notSet')}
                        </p>
                      </div>
                    </div>
                    <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                      {t('settings.change')}
                    </button>
                  </div>

                  <div className="border-t border-border/30" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-500/10">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t('settings.email')}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email || t('settings.notSet')}
                        </p>
                      </div>
                    </div>
                    <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                      {t('settings.change')}
                    </button>
                  </div>

                  <div className="border-t border-border/30" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-500/10">
                        <Lock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t('settings.password')}</p>
                        <p className="text-xs text-muted-foreground">********</p>
                      </div>
                    </div>
                    <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                      {t('settings.change')}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Preferences Section */}
              <motion.div
                variants={fadeUp}
                custom={1}
                className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 space-y-5"
              >
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sun className="w-5 h-5 text-primary" />
                  {t('settings.preferences')}
                </h2>

                <div className="space-y-4">
                  {/* Theme toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-500/10">
                        {darkMode ? (
                          <Moon className="w-4 h-4 text-primary" />
                        ) : (
                          <Sun className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t('settings.theme')}</p>
                        <p className="text-xs text-muted-foreground">
                          {darkMode ? t('settings.dark') : t('settings.light')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        darkMode ? 'bg-primary' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          darkMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="border-t border-border/30" />

                  {/* Language */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-500/10">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t('settings.language')}</p>
                        <p className="text-xs text-muted-foreground">
                          {locale === 'ru' ? 'Русский' : 'Қазақша'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleLocale}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-border/50 transition-all"
                    >
                      {locale === 'ru' ? 'RU' : 'KZ'}
                    </button>
                  </div>

                  <div className="border-t border-border/30" />

                  {/* Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-500/10">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t('settings.notifications')}</p>
                        <p className="text-xs text-muted-foreground">
                          {notifications ? t('settings.enabled') : t('settings.disabled')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications(!notifications)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        notifications ? 'bg-primary' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          notifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Security Section — 2FA removed (no backend support) */}

              {/* Danger Zone */}
              <motion.div
                variants={fadeUp}
                custom={4}
                className="rounded-3xl border border-red-500/30 bg-red-500/5 p-6 space-y-4"
              >
                <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  {t('settings.danger')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('settings.deleteDescription')}
                </p>
                <button className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
                  {t('settings.deleteAccount')}
                </button>
              </motion.div>
            </motion.div>
    </div>
  );
}
