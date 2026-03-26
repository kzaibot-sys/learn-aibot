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
  Shield,
  CreditCard,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { useAuthStore } from '@/lib/auth';

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
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  function toggleTheme() {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-72">
          <TopBar />
          <main className="p-6 lg:p-8 space-y-8 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-bold text-foreground mb-1">Настройки</h1>
              <p className="text-sm text-muted-foreground">
                Управляйте своим аккаунтом и предпочтениями
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
                  Аккаунт
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Имя</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.firstName || 'Не указано'}
                        </p>
                      </div>
                    </div>
                    <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                      Изменить
                    </button>
                  </div>

                  <div className="border-t border-border/30" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Email</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email || 'Не указано'}
                        </p>
                      </div>
                    </div>
                    <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                      Изменить
                    </button>
                  </div>

                  <div className="border-t border-border/30" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Lock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Пароль</p>
                        <p className="text-xs text-muted-foreground">********</p>
                      </div>
                    </div>
                    <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                      Изменить
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
                  Настройки
                </h2>

                <div className="space-y-4">
                  {/* Theme toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        {darkMode ? (
                          <Moon className="w-4 h-4 text-primary" />
                        ) : (
                          <Sun className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Тема</p>
                        <p className="text-xs text-muted-foreground">
                          {darkMode ? 'Тёмная' : 'Светлая'}
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
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Язык</p>
                        <p className="text-xs text-muted-foreground">Русский</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="border-t border-border/30" />

                  {/* Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Уведомления</p>
                        <p className="text-xs text-muted-foreground">
                          {notifications ? 'Включены' : 'Выключены'}
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

              {/* Subscription Section */}
              <motion.div
                variants={fadeUp}
                custom={2}
                className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 space-y-5"
              >
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Подписка
                </h2>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-primary via-accent to-orange-400 px-3 py-1 rounded-full">
                      Premium
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Действует до 26 марта 2027
                    </p>
                  </div>
                  <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                    Управление
                  </button>
                </div>
              </motion.div>

              {/* Security Section */}
              <motion.div
                variants={fadeUp}
                custom={3}
                className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 space-y-5"
              >
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Безопасность
                </h2>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Двухфакторная аутентификация
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {twoFactor
                          ? 'Включена — ваш аккаунт защищён'
                          : 'Выключена — рекомендуем включить'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      twoFactor ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        twoFactor ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>

              {/* Danger Zone */}
              <motion.div
                variants={fadeUp}
                custom={4}
                className="rounded-3xl border border-red-500/30 bg-red-500/5 p-6 space-y-4"
              >
                <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Опасная зона
                </h2>
                <p className="text-sm text-muted-foreground">
                  Удаление аккаунта необратимо. Все ваши данные, курсы и прогресс будут
                  безвозвратно удалены.
                </p>
                <button className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
                  Удалить аккаунт
                </button>
              </motion.div>
            </motion.div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
