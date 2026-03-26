'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface ModuleProgress {
  moduleId: string;
  moduleTitle: string;
  completedLessons: number;
  totalLessons: number;
  percent: number;
}

interface CourseProgressData {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  percent: number;
  modules?: ModuleProgress[];
}

interface Props {
  courseId: string;
  showModules?: boolean;
  className?: string;
}

export function CourseProgress({ courseId, showModules = false, className = '' }: Props) {
  const [progress, setProgress] = useState<CourseProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<CourseProgressData>(`/api/progress/course/${courseId}`)
      .then(setProgress)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="h-3 skeleton rounded-full w-full" />
        <div className="h-2 skeleton rounded-full w-1/3" />
      </div>
    );
  }

  if (!progress) return null;

  const percent = Math.round(progress.percent ?? 0);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Overall progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground font-medium">Прогресс курса</span>
          <span className="font-bold text-foreground">{percent}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-border/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {progress.completedLessons} из {progress.totalLessons} уроков
        </p>
      </div>

      {/* Module breakdown */}
      {showModules && progress.modules && progress.modules.length > 0 && (
        <div className="space-y-2 pt-1">
          {progress.modules.map(mod => (
            <div key={mod.moduleId} className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span className="truncate max-w-[70%]">{mod.moduleTitle}</span>
                <span>{mod.completedLessons}/{mod.totalLessons}</span>
              </div>
              <div className="w-full h-1 rounded-full bg-border/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-500"
                  style={{ width: `${mod.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
