'use client';

import { motion } from 'framer-motion';
import { CalendarDays, Clock } from 'lucide-react';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { useI18n } from '@/lib/i18n/context';

export default function CalendarPage() {
  const { t } = useI18n();

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 md:ml-72 ml-0">
          <TopBar />
          <main className="p-3 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/15 to-orange-400/10 border border-primary/20 mb-6"
              >
                <CalendarDays className="w-16 h-16 text-primary" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-2xl font-bold text-foreground mb-3"
              >
                {t('calendar.coming')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="text-sm text-muted-foreground max-w-md mb-8"
              >
                {t('calendar.comingDesc')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="flex items-center gap-2 text-xs text-muted-foreground/60"
              >
                <Clock className="w-4 h-4" />
                <span>{t('calendar.soon')}</span>
              </motion.div>
            </motion.div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
