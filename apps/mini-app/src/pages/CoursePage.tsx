import { useCourseDetail, useCourseProgress } from '../hooks/useCourses';

interface CoursePageProps {
  slug: string;
  onSelectLesson: (lessonId: string) => void;
}

export function CoursePage({ slug, onSelectLesson }: CoursePageProps) {
  const { course, loading, error } = useCourseDetail(slug);
  const { progress } = useCourseProgress(course?.id || '');

  if (loading) {
    return <div className="flex items-center justify-center p-8 text-tg-hint">Загрузка...</div>;
  }

  if (error || !course) {
    return <div className="p-4 text-red-500">{error || 'Курс не найден'}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-tg-text mb-2">{course.title}</h1>
      {course.description && (
        <p className="text-tg-hint text-sm mb-4">{course.description}</p>
      )}

      {progress && (
        <div className="mb-4 bg-tg-secondary-bg rounded-lg p-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-tg-text">Прогресс</span>
            <span className="text-tg-hint">{progress.completedLessons}/{progress.totalLessons}</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="bg-tg-button rounded-full h-2 transition-all"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {course.modules.map((mod) => (
        <div key={mod.id} className="mb-4">
          <h2 className="text-base font-semibold text-tg-text mb-2">{mod.title}</h2>
          {mod.description && (
            <p className="text-tg-hint text-xs mb-2">{mod.description}</p>
          )}
          <div className="space-y-1">
            {mod.lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => onSelectLesson(lesson.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-tg-secondary-bg hover:opacity-80 transition-opacity text-left"
              >
                <span className="text-xs text-tg-hint w-6 shrink-0">
                  {lesson.type === 'VIDEO' ? '▶' : lesson.type === 'TEXT' ? '📄' : '❓'}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-tg-text block truncate">{lesson.title}</span>
                  {lesson.duration && (
                    <span className="text-xs text-tg-hint">{Math.floor(lesson.duration / 60)} мин</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
