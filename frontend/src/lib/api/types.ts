export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type CourseListSortBy = "relevance" | "newest" | "popular";

export interface CourseListQuery {
  search?: string;
  category?: string;
  level?: string;
  language?: string;
  sortBy?: CourseListSortBy;
  page?: number;
  limit?: number;
}

export interface CourseItem {
  id: string;
  slug?: string;
  title: string;
  description?: string | null;
  category?: string | null;
  level?: string | null;
  language?: string | null;
  priceCents?: number;
}

export type RecommendedCourseItem = CourseItem;

export interface CourseLessonItem {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT" | "QUIZ";
  order: number;
}

export interface CourseModuleItem {
  id: string;
  title: string;
  order: number;
  lessons: CourseLessonItem[];
}

export interface CourseDetails extends CourseItem {
  slug: string;
  modules: CourseModuleItem[];
}

export interface CurriculumLesson extends CourseLessonItem {
  unlocked: boolean;
  completed: boolean;
  progress: {
    watchedDuration: number;
    completed: boolean;
    quizScore?: number | null;
    updatedAt?: string | null;
  } | null;
}

export interface CurriculumModule {
  id: string;
  title: string;
  order: number;
  lessons: CurriculumLesson[];
}

export interface CourseCurriculum {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  progress: number;
  modules: CurriculumModule[];
}

export interface EnrollmentItem {
  id: string;
  courseId: string;
  courseTitle?: string;
  progressPercent?: number;
  course?: CourseItem;
}

export interface LessonProgressPayload {
  watchedDuration: number;
  completed: boolean;
  quizScore?: number;
}

export interface LessonDetails {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT" | "QUIZ";
  contentUrl?: string | null;
  content?: string | null;
  module?: { id: string; title: string; order: number };
  course?: { id: string; title: string };
  progress?: {
    watchedDuration: number;
    completed: boolean;
    quizScore?: number | null;
  } | null;
}

export interface ProgressSummaryItem {
  courseId: string;
  courseTitle?: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

export type LearnerActivityType =
  | "ENROLLED"
  | "LESSON_PROGRESS"
  | "LESSON_COMPLETED"
  | "QUIZ_SUBMITTED";

export interface LearnerActivityItem {
  type: LearnerActivityType | string;
  courseId: string | null;
  courseTitle?: string | null;
  lessonId: string | null;
  lessonTitle?: string | null;
  timestamp: string;
  meta: Record<string, unknown>;
}

export interface QuizPublicOption {
  id: string;
  text: string;
}

export interface QuizPublicQuestion {
  id: string;
  prompt: string;
  options: QuizPublicOption[];
}

export interface QuizPublicPayload {
  passingScorePercent: number;
  questions: QuizPublicQuestion[];
}

export interface LessonQuizResponse {
  lessonId: string;
  title: string;
  quiz: QuizPublicPayload;
}

export interface QuizSubmitRequest {
  answers: Record<string, string>;
}

export interface QuizSubmitResponse {
  score: number;
  completed: boolean;
  progress: {
    watchedDuration: number;
    completed: boolean;
    quizScore: number | null;
  };
  courseProgress: number;
}

export interface ModerationCourseItem {
  id: string;
  slug: string;
  title: string;
  ownerId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  moderationReason?: string | null;
  updatedAt: string;
}

export interface GamificationAchievement {
  key: string;
  title: string;
  description: string;
  xpReward: number;
  awardedAt: string;
}

export interface GamificationProfile {
  xp: number;
  level: number;
  streakDays: number;
  longestStreak: number;
  lastActiveDate: string | null;
  achievements: GamificationAchievement[];
}

export interface DashboardSummary {
  profile: UserProfile | null;
  stats: {
    enrolledCourses: number;
    completedCourses: number;
    averageProgress: number;
  };
  gamification: {
    xp: number;
    level: number;
    streakDays: number;
    longestStreak: number;
    lastActiveDate: string | null;
  };
  enrollments: Array<{
    id: string;
    progress: number;
    enrolledAt: string;
    course: CourseItem;
  }>;
  achievements: GamificationAchievement[];
  recentActivity: LearnerActivityItem[];
}

export interface AdminOverview {
  widgets: {
    totalUsers: number;
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    activeStreakUsers: number;
    totalRevenueCents: number;
  };
  topCourses: Array<{
    id: string;
    slug: string;
    title: string;
    priceCents: number;
    enrollmentCount: number;
    moduleCount: number;
  }>;
}

export interface AdminUserItem {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  createdAt: string;
  gamificationProfile?: {
    xp: number;
    level: number;
    streakDays: number;
  } | null;
  _count: {
    enrollments: number;
    courses: number;
    payments: number;
    achievementAwards: number;
  };
}

export interface AdminCourseItem {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  level?: string | null;
  language?: string | null;
  priceCents: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  moderationReason?: string | null;
  owner: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  _count: {
    enrollments: number;
    modules: number;
    payments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CourseStructureLesson {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT" | "QUIZ";
  order: number;
  mediaAssetId?: string | null;
  contentUrl?: string | null;
}

export interface CourseStructureModule {
  id: string;
  title: string;
  order: number;
  lessons: CourseStructureLesson[];
}

export interface CourseStructure {
  id: string;
  slug: string;
  title: string;
  modules: CourseStructureModule[];
}

export interface InstructorManagedCourseItem {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: string;
  moduleCount: number;
  lessonCount: number;
}

export interface AdminPaymentItem {
  id: string;
  amountCents: number;
  currency: string;
  provider: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  course: {
    id: string;
    slug: string;
    title: string;
  };
}

export interface PaymentCheckoutResult {
  payment: {
    id: string;
    amountCents: number;
    currency: string;
    provider: string;
    status: string;
    createdAt: string;
  };
  enrollment: {
    id: string;
    userId: string;
    courseId: string;
    progress: number;
    enrolledAt: string;
  };
  enrolled: boolean;
  course: {
    id: string;
    title: string;
  };
}

export interface MediaAsset {
  id: string;
  type: "VIDEO" | "FILE";
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  streamUrl: string;
  createdAt: string;
}

export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  status?: "PENDING" | "ACCEPTED" | "DECLINED" | string;
  fromUser?: FriendUserProfile;
  toUser?: FriendUserProfile;
}

export interface FriendRequestsSplit {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface FriendListItem {
  id: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  isOnline?: boolean;
  lastSeenAt?: string | null;
  since?: string;
}

export interface FriendUserProfile {
  id: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  isOnline?: boolean;
  lastSeenAt?: string | null;
}

export interface ChatRoom {
  id: string;
  type?: "DIRECT" | "COURSE" | string;
  title?: string | null;
  peerUserId?: string | null;
  peer?: FriendUserProfile | null;
  course?: {
    id: string;
    slug?: string;
    title?: string;
  } | null;
  updatedAt?: string | null;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
}

export interface ChatMessage {
  id: string;
  roomId?: string;
  senderId: string;
  body: string;
  createdAt: string;
}
