import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';

interface EnrolledCourse {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

interface ProgressPageProps {
  onSelectCourse: (slug: string) => void;
}

export function ProgressPage({ onSelectCourse }: ProgressPageProps) {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress(): Promise<void> {
      try {
        // Fetch enrolled courses and their progress
        const enrollments = await apiRequest<Array<{
          course: { id: string; title: string; slug: string };
        }>>('/api/courses');

        // For simplicity, show all available courses
        // In a real app, filter by enrollment
        const coursesData = enrollments as unknown as Array<{
          id: string;
          title: string;
          slug: string;
        }>;

        const withProgress = await Promise.all(
          coursesData.map(async (course) => {
            try {
              const progress = await apiRequest<{
                totalLessons: number;
                completedLessons: number;
                progressPercent: number;
              }>(`/api/progress/course/${course.id}`);

              return {
                courseId: course.id,
                courseTitle: course.title,
                courseSlug: course.slug,
                ...progress,
              };
            } catch {
              return {
                courseId: course.id,
                courseTitle: course.title,
                courseSlug: course.slug,
                totalLessons: 0,
                completedLessons: 0,
                progressPercent: 0,
              };
            }
          }),
        );

        setCourses(withProgress);
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center p-8 text-tg-hint">Загрузка...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-tg-hint mb-2">У вас пока нет курсов</p>
        <p className="text-tg-hint text-sm">Перейдите к каталогу, чтобы начать обучение</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-tg-text mb-4">Мой прогресс</h1>
      <div className="space-y-3">
        {courses.map((course) => (
          <button
            key={course.courseId}
            onClick={() => onSelectCourse(course.courseSlug)}
            className="w-full bg-tg-secondary-bg rounded-lg p-4 text-left active:opacity-80 transition-opacity"
          >
            <h3 className="text-sm font-semibold text-tg-text mb-2">{course.courseTitle}</h3>
            <div className="flex justify-between text-xs text-tg-hint mb-1">
              <span>Пройдено {course.completedLessons} из {course.totalLessons}</span>
              <span>{course.progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-1.5">
              <div
                className="bg-tg-button rounded-full h-1.5 transition-all"
                style={{ width: `${course.progressPercent}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
