'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';
import { AchievementToast } from './AchievementToast';

interface CompleteLessonResponse {
  xpEarned: number;
  streakBonus: number;
  totalXp: number;
  level: number;
  levelUp: boolean;
  newAchievements: Array<{ title: string; description: string; icon: string; xpReward: number }>;
}

interface Props {
  lessonId: string;
  onComplete?: () => void;
  alreadyCompleted?: boolean;
}

export function CompleteLessonButton({ lessonId, onComplete, alreadyCompleted }: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyCompleted ?? false);
  const [xpPopup, setXpPopup] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState(false);
  const [toastAchievements, setToastAchievements] = useState<
    Array<{ title: string; description: string; icon: string; xpReward: number }>
  >([]);

  async function handleComplete() {
    if (done || loading) return;
    setLoading(true);
    try {
      const res = await apiRequest<CompleteLessonResponse>(
        `/api/progress/lesson/${lessonId}/complete`,
        { method: 'POST' },
      );

      setDone(true);
      setXpPopup(res.xpEarned + (res.streakBonus ?? 0));

      if (res.levelUp) {
        setLevelUp(true);
        setTimeout(() => setLevelUp(false), 4000);
      }

      if (res.newAchievements?.length > 0) {
        setToastAchievements(res.newAchievements);
      }

      setTimeout(() => setXpPopup(null), 2500);

      onComplete?.();
    } catch {
      // silently fail — lesson might already be completed
    } finally {
      setLoading(false);
    }
  }

  function dismissAchievement(index: number) {
    setToastAchievements(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <>
      <div className="relative inline-flex">
        <button
          onClick={handleComplete}
          disabled={done || loading}
          className={`hover-lift inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all min-h-[44px] ${
            done
              ? 'bg-green-500/10 text-green-500 border border-green-500/30 cursor-default'
              : 'bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : done ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {done ? t('lesson.completed') : t('lesson.complete')}
        </button>

        {/* XP earned popup */}
        {xpPopup !== null && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 animate-fade-in-up pointer-events-none"
            style={{ animation: 'fadeInUp 0.4s ease-out forwards' }}
          >
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 text-white text-sm font-bold shadow-lg shadow-orange-500/30 whitespace-nowrap">
              <Zap className="w-3 h-3" />
              +{xpPopup} XP
            </span>
          </div>
        )}
      </div>

      {/* Level up message */}
      {levelUp && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="glass-card px-6 py-4 rounded-3xl border border-orange-500/30 shadow-2xl shadow-orange-500/20 text-center">
            <p className="text-lg font-bold gradient-text">🎉 Новый уровень!</p>
            <p className="text-sm text-muted-foreground mt-1">Вы повысили свой уровень!</p>
          </div>
        </div>
      )}

      {/* Achievement toasts */}
      {toastAchievements.map((ach, i) => (
        <AchievementToast
          key={i}
          achievement={ach}
          onClose={() => dismissAchievement(i)}
        />
      ))}
    </>
  );
}
