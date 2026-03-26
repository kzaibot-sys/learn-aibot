'use client';

import { useEffect, useState } from 'react';
import { Flame, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface UserStats {
  completedLessons: number;
  completedCourses: number;
  currentStreak: number;
  lessonsToday: number;
  totalXp: number;
  level: number;
  currentLevelXp: number;
  requiredXp: number;
  percent: number;
}

interface Props {
  compact?: boolean;
}

export function UserLevel({ compact = false }: Props) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<UserStats>('/api/user/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={`space-y-2 ${compact ? 'px-1' : 'p-4'}`}>
        <div className="h-4 skeleton rounded-full w-3/4" />
        <div className="h-2 skeleton rounded-full w-full" />
        {!compact && <div className="h-3 skeleton rounded-full w-1/2" />}
      </div>
    );
  }

  if (!stats) return null;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Level badge */}
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary via-accent to-orange-400 flex items-center justify-center shadow-md shadow-primary/25 shrink-0">
              <span className="text-[10px] font-bold text-white">{stats.level}</span>
            </div>
            <span className="text-xs font-semibold text-foreground">Lvl {stats.level}</span>
          </div>
          {/* Streak */}
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-medium text-muted-foreground">{stats.currentStreak}д</span>
          </div>
        </div>
        {/* XP bar */}
        <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-orange-400 transition-all duration-700"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground">{stats.currentLevelXp} XP</span>
          <span className="text-[10px] text-muted-foreground">{stats.requiredXp} XP</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-5 space-y-4">
      <div className="flex items-center gap-4">
        {/* Level circle */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-orange-400 flex flex-col items-center justify-center shadow-lg shadow-primary/25 shrink-0">
          <span className="text-[10px] font-semibold text-white/80 leading-none">LVL</span>
          <span className="text-lg font-bold text-white leading-none">{stats.level}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground">Уровень {stats.level}</span>
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-muted-foreground">{stats.currentStreak} дней</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="w-3 h-3 text-primary" />
            <span>{stats.totalXp} XP всего</span>
          </div>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{stats.percent}% до Level {stats.level + 1}</span>
          <span>{stats.currentLevelXp} / {stats.requiredXp} XP</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-border/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-orange-400 transition-all duration-700"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
