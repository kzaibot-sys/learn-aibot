'use client';

import { useEffect, useState } from 'react';
import { Trophy, Flame, Zap } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

interface LeaderboardEntry {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  totalXp: number;
  level: number;
  streak: number;
  rank: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

function getInitials(entry: LeaderboardEntry): string {
  if (entry.firstName) {
    return (entry.firstName[0] + (entry.lastName?.[0] ?? '')).toUpperCase();
  }
  return entry.email[0].toUpperCase();
}

function getDisplayName(entry: LeaderboardEntry): string {
  if (entry.firstName) {
    return [entry.firstName, entry.lastName].filter(Boolean).join(' ');
  }
  return entry.email.split('@')[0];
}

export default function LeaderboardPage() {
  const { t } = useI18n();
  const currentUser = useAuthStore(s => s.user);
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<LeaderboardEntry[]>('/api/leaderboard')
      .then(setLeaders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up">

            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                {t('nav.leaderboard')}
              </h1>
              <p className="text-sm text-muted-foreground">
                Топ студентов по опыту и достижениям
              </p>
            </div>

            {/* Top 3 podium */}
            {!loading && leaders.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                {/* 2nd place */}
                <div className="flex flex-col items-center gap-2 pt-4">
                  <div className="text-2xl">🥈</div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/60 to-amber-400/60 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {getInitials(leaders[1])}
                  </div>
                  <p className="text-xs font-medium text-foreground text-center truncate w-full">
                    {getDisplayName(leaders[1])}
                  </p>
                  <span className="text-[10px] text-muted-foreground">{leaders[1].totalXp} XP</span>
                </div>

                {/* 1st place */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-3xl">🥇</div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 flex items-center justify-center text-white text-base font-bold shadow-xl shadow-orange-500/30">
                    {getInitials(leaders[0])}
                  </div>
                  <p className="text-xs font-semibold text-foreground text-center truncate w-full">
                    {getDisplayName(leaders[0])}
                  </p>
                  <span className="text-[10px] font-bold text-primary">{leaders[0].totalXp} XP</span>
                </div>

                {/* 3rd place */}
                <div className="flex flex-col items-center gap-2 pt-8">
                  <div className="text-2xl">🥉</div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/40 to-amber-400/40 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {getInitials(leaders[2])}
                  </div>
                  <p className="text-xs font-medium text-foreground text-center truncate w-full">
                    {getDisplayName(leaders[2])}
                  </p>
                  <span className="text-[10px] text-muted-foreground">{leaders[2].totalXp} XP</span>
                </div>
              </div>
            )}

            {/* Full leaderboard table */}
            <div className="glass-card rounded-3xl border border-border/50 overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-14 skeleton rounded-2xl" />
                  ))}
                </div>
              ) : leaders.length === 0 ? (
                <div className="p-12 text-center">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Нет данных</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {/* Table header */}
                  <div className="px-4 py-3 grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="col-span-1">#</span>
                    <span className="col-span-5">Студент</span>
                    <span className="col-span-2 text-center">Уровень</span>
                    <span className="col-span-2 text-center">Серия</span>
                    <span className="col-span-2 text-right">XP</span>
                  </div>

                  {leaders.map((entry, i) => {
                    const isCurrentUser = entry.id === currentUser?.id;
                    const medal = MEDALS[i] ?? null;

                    return (
                      <div
                        key={entry.id}
                        className={`px-4 py-3 grid grid-cols-12 gap-2 items-center transition-colors ${
                          isCurrentUser
                            ? 'bg-primary/5 border-l-2 border-primary'
                            : 'hover:bg-secondary/30'
                        }`}
                      >
                        {/* Rank */}
                        <div className="col-span-1 text-sm font-bold text-muted-foreground">
                          {medal ?? <span className="text-foreground">{entry.rank}</span>}
                        </div>

                        {/* User */}
                        <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                            i === 0
                              ? 'bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 shadow-md shadow-orange-500/25'
                              : 'bg-gradient-to-br from-orange-500/60 to-amber-400/60'
                          }`}>
                            {getInitials(entry)}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                              {getDisplayName(entry)}
                              {isCurrentUser && <span className="ml-1 text-[10px] text-primary/70">(вы)</span>}
                            </p>
                          </div>
                        </div>

                        {/* Level */}
                        <div className="col-span-2 flex justify-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-primary text-xs font-bold">
                            <Zap className="w-2.5 h-2.5" />
                            {entry.level}
                          </span>
                        </div>

                        {/* Streak */}
                        <div className="col-span-2 flex justify-center">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Flame className="w-3 h-3 text-orange-400" />
                            {entry.streak}
                          </span>
                        </div>

                        {/* XP */}
                        <div className="col-span-2 text-right">
                          <span className="text-sm font-bold text-foreground">{entry.totalXp.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

    </div>
  );
}
