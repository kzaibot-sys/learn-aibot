import { useCallback } from 'react';
import { useLessonDetail } from '../hooks/useCourses';
import { VideoPlayer } from '../components/VideoPlayer';

interface LessonPageProps {
  slug: string;
  lessonId: string;
  onBack: () => void;
}

export function LessonPage({ slug, lessonId, onBack }: LessonPageProps) {
  const { lesson, loading, error, completeLesson, updateWatchtime } = useLessonDetail(slug, lessonId);

  const handleTimeUpdate = useCallback((currentTime: number) => {
    updateWatchtime(currentTime).catch(console.error);
  }, [updateWatchtime]);

  const handleComplete = useCallback(async () => {
    try {
      await completeLesson();
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  }, [completeLesson]);

  if (loading) {
    return <div className="flex items-center justify-center p-8 text-tg-hint">Загрузка...</div>;
  }

  if (error || !lesson) {
    return <div className="p-4 text-red-500">{error || 'Урок не найден'}</div>;
  }

  return (
    <div className="pb-20">
      {/* Back button */}
      <button
        onClick={onBack}
        className="p-4 text-tg-link text-sm flex items-center gap-1"
      >
        ← Назад к курсу
      </button>

      <div className="px-4">
        <h1 className="text-lg font-bold text-tg-text mb-3">{lesson.title}</h1>

        {/* Video player */}
        {lesson.type === 'VIDEO' && lesson.videoUrl && (
          <div className="mb-4">
            <VideoPlayer
              src={lesson.videoUrl}
              initialTime={lesson.progress?.watchedSec ?? 0}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        )}

        {/* Text content */}
        {lesson.content && (
          <div
            className="prose prose-sm text-tg-text mb-4"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        )}

        {/* Description */}
        {lesson.description && (
          <p className="text-tg-hint text-sm mb-4">{lesson.description}</p>
        )}

        {/* Tasks */}
        {lesson.tasks.length > 0 && (
          <div className="mb-4">
            <h2 className="text-base font-semibold text-tg-text mb-2">Задания</h2>
            {lesson.tasks.map(task => (
              <div key={task.id} className="bg-tg-secondary-bg rounded-lg p-3 mb-2">
                <h3 className="text-sm font-medium text-tg-text">{task.title}</h3>
                <p className="text-xs text-tg-hint mt-1">{task.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Complete button */}
        <button
          onClick={handleComplete}
          disabled={lesson.progress?.completed}
          className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
            lesson.progress?.completed
              ? 'bg-green-500 text-white cursor-default'
              : 'bg-tg-button text-tg-button-text active:opacity-80'
          }`}
        >
          {lesson.progress?.completed ? 'Урок выполнен ✓' : 'Отметить как выполненный'}
        </button>
      </div>
    </div>
  );
}
