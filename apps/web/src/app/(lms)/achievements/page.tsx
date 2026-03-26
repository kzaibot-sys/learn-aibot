'use client';

import { useEffect, useState } from 'react';
import {
  Trophy,
  Lock,
  Zap,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { apiRequest } from '@/lib/api';

interface UserStats {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  requiredXp: number;
  percent: number;
  currentStreak: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  earned: boolean;
  earnedAt: string | null;
}

export default function AchievementsPage() {
  const { t } = useI18n();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<UserStats>('/api/user/stats'),
      apiRequest<Achievement[]>('/api/user/achievements'),
    ])
      .then(([s, a]) => {
        setStats(s);
        setAchievements(a);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unlockedAchievements = achievements.filter(a => a.earned);
  const lockedAchievements = achievements.filter(a => !a.earned);

  return (
    <div className="space-y-8 animate-fade-in-up">

            {/* XP Progress Bar */}
            {loading ? (
              <div className="h-24 skeleton rounded-3xl" />
            ) : stats ? (
              <div className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 via-orange-400/15 to-orange-400/10 border border-orange-500/20">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        {t('achievements.level')} {stats.level}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {stats.percent}% {t('achievements.xpToLevel')} {stats.level + 1} — {stats.currentLevelXp} XP
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {stats.currentLevelXp} / {stats.requiredXp} XP
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-border/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 transition-all duration-700"
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
              </div>
            ) : null}

            {/* Unlocked Achievements */}
            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">
                {t('achievements.unlocked')}
              </h3>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-28 skeleton rounded-3xl" />
                  ))}
                </div>
              ) : unlockedAchievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {unlockedAchievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className="glass-card hover-lift rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 flex gap-4 hover:border-orange-500/30 transition-colors"
                    >
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/25 text-xl">
                        {achievement.icon || '🏆'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {achievement.title}
                          </h4>
                          <span className="text-xs font-bold text-primary bg-orange-500/10 px-2 py-0.5 rounded-full shrink-0 ml-2 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            +{achievement.xpReward}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        {achievement.earnedAt && (
                          <p className="text-[10px] text-muted-foreground/70">
                            {new Date(achievement.earnedAt).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('achievements.lockedLabel')}</p>
              )}
            </section>

            {/* Locked Achievements */}
            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">
                {t('achievements.locked')}
              </h3>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-28 skeleton rounded-3xl" />
                  ))}
                </div>
              ) : lockedAchievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {lockedAchievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 flex gap-4 opacity-50 grayscale"
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
                            {achievement.xpReward} XP
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/70 mb-2">
                          {achievement.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50">
                          {t('achievements.lockedLabel')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
    </div>
  );
}
