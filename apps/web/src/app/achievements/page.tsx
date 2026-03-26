'use client';

import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  BookOpen,
  Zap,
  Star,
  Crown,
  Users,
  Target,
  Lock,
} from 'lucide-react';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';

/* ---------- data ---------- */

const currentLevel = 5;
const currentXP = 320;
const xpForNextLevel = 470;
const xpPercent = 68;

interface Achievement {
  id: string;
  title: string;
  description: string;
  xp: number;
  icon: React.ElementType;
  unlocked: boolean;
  date?: string;
}

const achievements: Achievement[] = [
  {
    id: '1',
    title: 'Первый шаг',
    description: 'Завершите первый урок',
    xp: 10,
    icon: BookOpen,
    unlocked: true,
    date: '15 марта 2026',
  },
  {
    id: '2',
    title: 'Огненная серия',
    description: 'Учитесь 7 дней подряд',
    xp: 50,
    icon: Flame,
    unlocked: true,
    date: '20 марта 2026',
  },
  {
    id: '3',
    title: 'Мастер знаний',
    description: 'Завершите 10 курсов',
    xp: 100,
    icon: Trophy,
    unlocked: true,
    date: '22 марта 2026',
  },
  {
    id: '4',
    title: 'Быстрый ученик',
    description: 'Завершите курс за неделю',
    xp: 75,
    icon: Zap,
    unlocked: true,
    date: '24 марта 2026',
  },
  {
    id: '5',
    title: 'Идеальный результат',
    description: 'Получите 100% на 5 тестах',
    xp: 150,
    icon: Star,
    unlocked: true,
    date: '25 марта 2026',
  },
  {
    id: '6',
    title: 'Легенда платформы',
    description: 'Достигните level 10',
    xp: 500,
    icon: Crown,
    unlocked: false,
  },
  {
    id: '7',
    title: 'Командный игрок',
    description: 'Помогите 10 студентам',
    xp: 200,
    icon: Users,
    unlocked: false,
  },
  {
    id: '8',
    title: 'Марафонец',
    description: 'Учитесь 30 дней подряд',
    xp: 300,
    icon: Target,
    unlocked: false,
  },
];

const unlockedAchievements = achievements.filter(a => a.unlocked);
const lockedAchievements = achievements.filter(a => !a.unlocked);

/* ---------- animation ---------- */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ---------- component ---------- */

export default function AchievementsPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-72">
          <TopBar />
          <main className="p-6 lg:p-8 space-y-8">
            {/* XP Progress Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/15 to-orange-400/10 border border-primary/20">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Level {currentLevel}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {xpPercent}% XP до Level {currentLevel + 1} — {currentXP} XP
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {currentXP} / {xpForNextLevel} XP
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-border/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-orange-400"
                />
              </div>
            </motion.div>

            {/* Unlocked Achievements */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <h3 className="text-xl font-bold text-foreground mb-4">
                Открытые достижения
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {unlockedAchievements.map((achievement, i) => {
                  const Icon = achievement.icon;
                  return (
                    <motion.div
                      key={achievement.id}
                      variants={fadeUp}
                      custom={i}
                      className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 flex gap-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-primary via-accent to-orange-400 flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {achievement.title}
                          </h4>
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0 ml-2">
                            +{achievement.xp} XP
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        {achievement.date && (
                          <p className="text-[10px] text-muted-foreground/70">
                            {achievement.date}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* Locked Achievements */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <h3 className="text-xl font-bold text-foreground mb-4">
                Заблокированные
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {lockedAchievements.map((achievement, i) => {
                  return (
                    <motion.div
                      key={achievement.id}
                      variants={fadeUp}
                      custom={i + unlockedAchievements.length}
                      className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 flex gap-4 opacity-50"
                    >
                      <div className="p-3 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-center shrink-0">
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-muted-foreground truncate">
                            {achievement.title}
                          </h4>
                          <span className="text-xs font-medium text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full shrink-0 ml-2">
                            {achievement.xp} XP
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/70 mb-2">
                          {achievement.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50">
                          Заблокировано
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
