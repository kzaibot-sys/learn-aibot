export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  price: string;
  currency: string;
  isFree: boolean;
}

export interface CourseDetail extends CourseListItem {
  modules: ModuleDetail[];
}

export interface ModuleDetail {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: LessonSummary[];
}

export interface LessonSummary {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  order: number;
  isFree: boolean;
}

export interface LessonDetail extends LessonSummary {
  description: string | null;
  videoUrl: string | null;
  content: string | null;
}

export interface ProgressDto {
  lessonId: string;
  completed: boolean;
  watchedSec: number;
  completedAt: string | null;
}

export interface CourseProgressDto {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  lessons: ProgressDto[];
}

export interface CompleteLessonDto {
  lessonId: string;
}

export interface UpdateWatchtimeDto {
  watchedSec: number;
}
