export type LearnerActivityType =
  | 'ENROLLED'
  | 'LESSON_PROGRESS'
  | 'LESSON_COMPLETED'
  | 'QUIZ_SUBMITTED';

export interface LearnerActivityItem {
  type: LearnerActivityType;
  courseId: string;
  courseTitle: string;
  lessonId: string | null;
  lessonTitle: string | null;
  timestamp: string;
  meta: Record<string, unknown>;
}
