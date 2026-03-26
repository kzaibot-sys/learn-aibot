'use client';

import { useEffect, useState } from 'react';
import { X, Zap } from 'lucide-react';

interface Achievement {
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

interface Props {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementToast({ achievement, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in after mount
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-80 glass-card rounded-3xl border border-border/50 shadow-2xl p-4 transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-accent to-orange-400 flex items-center justify-center text-xl shrink-0 shadow-lg shadow-primary/25">
          {achievement.icon || '🏆'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                Новое достижение!
              </p>
              <h4 className="text-sm font-semibold text-foreground leading-snug">
                {achievement.title}
              </h4>
            </div>
            <button
              onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 -mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {achievement.description}
          </p>
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <Zap className="w-3 h-3" />
            +{achievement.xpReward} XP
          </span>
        </div>
      </div>

      {/* Progress bar auto-dismiss */}
      <div className="mt-3 h-0.5 rounded-full bg-border/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-orange-400"
          style={{
            width: visible ? '0%' : '100%',
            transition: visible ? 'width 5s linear' : 'none',
          }}
        />
      </div>
    </div>
  );
}
