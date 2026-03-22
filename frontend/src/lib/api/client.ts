import type {
  AdminCourseItem,
  AdminOverview,
  AdminPaymentItem,
  AdminUserItem,
  AuthTokens,
  ChatMessage,
  ChatRoom,
  CourseStructure,
  CourseCurriculum,
  CourseDetails,
  CourseItem,
  CourseListQuery,
  DashboardSummary,
  EnrollmentItem,
  FriendListItem,
  FriendRequest,
  FriendRequestsSplit,
  GamificationProfile,
  LearnerActivityItem,
  LessonDetails,
  LessonProgressPayload,
  LessonQuizResponse,
  MediaAsset,
  ModerationCourseItem,
  PaymentCheckoutResult,
  ProgressSummaryItem,
  InstructorManagedCourseItem,
  QuizSubmitRequest,
  QuizSubmitResponse,
  RecommendedCourseItem,
  UserProfile,
} from "@/lib/api/types";
import { requestJson } from "@/lib/api/http";
import { buildCoursesApiQueryString } from "@/lib/course-catalog-query";
import { useAuthStore } from "@/lib/store/auth-store";

function unwrapItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (
    payload &&
    typeof payload === "object" &&
    "items" in payload &&
    Array.isArray((payload as { items: unknown[] }).items)
  ) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

function normalizeChatRoom(raw: unknown): ChatRoom | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const id =
    typeof o.id === "string"
      ? o.id
      : typeof o.roomId === "string"
        ? o.roomId
        : null;
  if (!id) {
    return null;
  }
  return {
    id,
    type: typeof o.type === "string" ? o.type : undefined,
    title:
      typeof o.title === "string"
        ? o.title
        : typeof o.name === "string"
          ? o.name
          : undefined,
    peerUserId: typeof o.peerUserId === "string" ? o.peerUserId : undefined,
    peer:
      o.peer && typeof o.peer === "object"
        ? {
            id:
              typeof (o.peer as { id?: unknown }).id === "string"
                ? (o.peer as { id: string }).id
                : "",
            email:
              typeof (o.peer as { email?: unknown }).email === "string"
                ? (o.peer as { email: string }).email
                : undefined,
            firstName:
              typeof (o.peer as { firstName?: unknown }).firstName === "string" ||
              (o.peer as { firstName?: unknown }).firstName === null
                ? ((o.peer as { firstName?: string | null }).firstName ?? null)
                : undefined,
            lastName:
              typeof (o.peer as { lastName?: unknown }).lastName === "string" ||
              (o.peer as { lastName?: unknown }).lastName === null
                ? ((o.peer as { lastName?: string | null }).lastName ?? null)
                : undefined,
            role:
              typeof (o.peer as { role?: unknown }).role === "string"
                ? ((o.peer as { role: "STUDENT" | "INSTRUCTOR" | "ADMIN" }).role)
                : undefined,
            isOnline:
              typeof (o.peer as { isOnline?: unknown }).isOnline === "boolean"
                ? ((o.peer as { isOnline: boolean }).isOnline)
                : undefined,
            lastSeenAt:
              typeof (o.peer as { lastSeenAt?: unknown }).lastSeenAt === "string" ||
              (o.peer as { lastSeenAt?: unknown }).lastSeenAt === null
                ? ((o.peer as { lastSeenAt?: string | null }).lastSeenAt ?? null)
                : undefined,
          }
        : undefined,
    course:
      o.course && typeof o.course === "object"
        ? {
            id:
              typeof (o.course as { id?: unknown }).id === "string"
                ? (o.course as { id: string }).id
                : "",
            slug:
              typeof (o.course as { slug?: unknown }).slug === "string"
                ? (o.course as { slug: string }).slug
                : undefined,
            title:
              typeof (o.course as { title?: unknown }).title === "string"
                ? (o.course as { title: string }).title
                : undefined,
          }
        : undefined,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
    lastMessageAt:
      typeof o.lastMessageAt === "string" ? o.lastMessageAt : undefined,
    lastMessagePreview:
      typeof o.lastMessagePreview === "string" ? o.lastMessagePreview : undefined,
  };
}

function normalizeChatMessage(raw: unknown): ChatMessage | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : null;
  if (!id) {
    return null;
  }
  const senderId =
    typeof o.senderId === "string"
      ? o.senderId
      : typeof o.userId === "string"
        ? o.userId
        : null;
  const body =
    typeof o.body === "string"
      ? o.body
      : typeof o.content === "string"
        ? o.content
        : "";
  const createdAt = typeof o.createdAt === "string" ? o.createdAt : null;
  if (!senderId || !createdAt) {
    return null;
  }
  return {
    id,
    roomId: typeof o.roomId === "string" ? o.roomId : undefined,
    senderId,
    body,
    createdAt,
  };
}

type CourseMutationResult = {
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
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

type ModuleMutationResult = {
  id: string;
  title: string;
  order: number;
  courseId: string;
  createdAt: string;
  updatedAt: string;
};

type LessonMutationResult = {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT" | "QUIZ";
  contentUrl?: string | null;
  content?: string | null;
  mediaAssetId?: string | null;
  order: number;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
};

function normalizeFriendListItem(raw: unknown): FriendListItem | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.id === "string") {
    return {
      id: o.id,
      email: typeof o.email === "string" ? o.email : undefined,
      firstName:
        typeof o.firstName === "string" || o.firstName === null
          ? (o.firstName as string | null)
          : undefined,
      lastName:
        typeof o.lastName === "string" || o.lastName === null
          ? (o.lastName as string | null)
          : undefined,
      role: typeof o.role === "string" ? (o.role as "STUDENT" | "INSTRUCTOR" | "ADMIN") : undefined,
      isOnline: typeof o.isOnline === "boolean" ? o.isOnline : undefined,
      lastSeenAt:
        typeof o.lastSeenAt === "string" || o.lastSeenAt === null
          ? (o.lastSeenAt as string | null)
          : undefined,
      since: typeof o.since === "string" ? o.since : undefined,
    };
  }
  return null;
}

function normalizeFriendRequestsPayload(
  payload: unknown,
  viewerId?: string,
): FriendRequestsSplit {
  if (!payload || typeof payload !== "object") {
    return { incoming: [], outgoing: [] };
  }
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.incoming) || Array.isArray(obj.outgoing)) {
    const normalizeRequest = (
      item: unknown,
      direction: "incoming" | "outgoing",
    ): FriendRequest | null => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : null;
      if (!id) {
        return null;
      }

      const requester =
        row.requester && typeof row.requester === "object"
          ? normalizeFriendListItem(row.requester)
          : null;
      const addressee =
        row.addressee && typeof row.addressee === "object"
          ? normalizeFriendListItem(row.addressee)
          : null;

      const fallbackFrom =
        typeof row.fromUserId === "string"
          ? row.fromUserId
          : requester?.id ?? "";
      const fallbackTo =
        typeof row.toUserId === "string"
          ? row.toUserId
          : addressee?.id ?? "";

      return {
        id,
        fromUserId:
          direction === "incoming"
            ? requester?.id ?? fallbackFrom
            : fallbackFrom,
        toUserId:
          direction === "incoming"
            ? fallbackTo
            : addressee?.id ?? fallbackTo,
        createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString(),
        status: typeof row.status === "string" ? row.status : "PENDING",
        fromUser: requester ?? undefined,
        toUser: addressee ?? undefined,
      };
    };

    return {
      incoming: Array.isArray(obj.incoming)
        ? (obj.incoming as unknown[])
            .map((item) => normalizeRequest(item, "incoming"))
            .filter(Boolean) as FriendRequest[]
        : [],
      outgoing: Array.isArray(obj.outgoing)
        ? (obj.outgoing as unknown[])
            .map((item) => normalizeRequest(item, "outgoing"))
            .filter(Boolean) as FriendRequest[]
        : [],
    };
  }

  const items = unwrapItems<FriendRequest>(payload);
  if (!viewerId) {
    return { incoming: items, outgoing: [] };
  }

  return {
    incoming: items.filter((item) => item.toUserId === viewerId),
    outgoing: items.filter((item) => item.fromUserId === viewerId),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  return requestJson<T>(path, { ...options, token });
}

export const api = {
  auth: {
    register: (payload: { email: string; password: string; firstName?: string }) =>
      request<AuthTokens>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    login: (payload: { email: string; password: string }) =>
      request<AuthTokens>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  session: {
    refresh: (refreshToken: string) =>
      requestJson<AuthTokens>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }),
  },
  users: {
    me: () => request<UserProfile>("/users/me"),
    dashboard: () => request<DashboardSummary>("/users/me/dashboard"),
    heartbeat: () => request<{ isOnline: boolean; lastSeenAt: string | null }>("/users/me/presence/heartbeat", { method: "POST" }),
    search: (query: string, limit = 10) =>
      request<Array<{ id: string; email: string; firstName?: string | null; lastName?: string | null; role: "STUDENT" | "INSTRUCTOR" | "ADMIN" }>>(
        `/users/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      ),
    activityMine: async () => {
      const payload = await request<unknown>("/users/me/activity");
      const data = payload as { items?: unknown[] };
      return Array.isArray(data?.items)
        ? (data.items as LearnerActivityItem[])
        : unwrapItems<LearnerActivityItem>(payload);
    },
  },
  gamification: {
    me: () => request<GamificationProfile>("/gamification/me"),
  },
  courses: {
    list: async (params: CourseListQuery = {}) => {
      const qs = buildCoursesApiQueryString(params);
      const payload = await request<unknown>(`/courses${qs}`);
      return unwrapItems<CourseItem>(payload);
    },
    recommendations: async () => {
      const payload = await request<unknown>("/courses/recommendations");
      return unwrapItems<RecommendedCourseItem>(payload);
    },
    enroll: (courseId: string) =>
      request<{ enrollment: EnrollmentItem; enrolled: boolean }>(
        `/courses/${courseId}/enroll`,
        { method: "POST" },
      ),
    getById: (courseId: string) => request<CourseDetails>(`/courses/${courseId}`),
    curriculum: (courseId: string) =>
      request<CourseCurriculum>(`/courses/${courseId}/curriculum`),
  },
  payments: {
    checkoutCourse: (courseId: string) =>
      request<PaymentCheckoutResult>(`/payments/courses/${courseId}/checkout`, {
        method: "POST",
      }),
  },
  enrollments: {
    listMine: async () => {
      const payload = await request<unknown>("/users/me/enrollments");
      const raw = unwrapItems<{
        id: string;
        progress?: number;
        course?: {
          id: string;
          slug?: string;
          title?: string;
          category?: string;
          level?: string;
          language?: string;
          priceCents?: number;
        };
      }>(payload);
      return raw.map((item) => ({
        id: item.id,
        courseId: item.course?.id ?? "",
        courseTitle: item.course?.title ?? "",
        progressPercent:
          typeof item.progress === "number" ? Math.round(item.progress) : 0,
        course: item.course
          ? {
              id: item.course.id,
              slug: item.course.slug,
              title: item.course.title ?? "",
              category: item.course.category,
              level: item.course.level,
              language: item.course.language,
              priceCents: item.course.priceCents,
            }
          : undefined,
      })) as EnrollmentItem[];
    },
  },
  progress: {
    mine: async () => {
      const payload = await request<unknown>("/users/me/progress");
      const raw = unwrapItems<{
        courseId: string;
        courseTitle?: string;
        progress?: number;
        lessons?: Array<{ completed?: boolean }>;
      }>(payload);
      return raw.map((item) => {
        const totalLessons = item.lessons?.length ?? 0;
        const completedLessons =
          item.lessons?.filter((lesson) => Boolean(lesson.completed)).length ?? 0;
        return {
          courseId: item.courseId,
          courseTitle: item.courseTitle,
          completedLessons,
          totalLessons,
          progressPercent:
            typeof item.progress === "number" ? Math.round(item.progress) : 0,
        };
      }) as ProgressSummaryItem[];
    },
    updateLesson: (lessonId: string, body: LessonProgressPayload) =>
      request<{ progress: unknown; courseProgress: number }>(
        `/lessons/${lessonId}/progress`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
      ),
  },
  lessons: {
    getById: (lessonId: string) => request<LessonDetails>(`/lessons/${lessonId}`),
    getQuiz: (lessonId: string) => request<LessonQuizResponse>(`/lessons/${lessonId}/quiz`),
    submitQuiz: (lessonId: string, body: QuizSubmitRequest) =>
      request<QuizSubmitResponse>(`/lessons/${lessonId}/quiz/submit`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  instructor: {
    listManagedCourses: () =>
      request<InstructorManagedCourseItem[]>("/instructor/courses"),
    getCourseStructure: (courseId: string) =>
      request<CourseStructure>(`/instructor/courses/${courseId}/structure`),
    createCourse: (payload: {
      title: string;
      slug: string;
      description?: string;
      category?: string;
      level?: string;
      language?: string;
      priceCents?: number;
    }) =>
      request<CourseMutationResult>("/instructor/courses", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    addModule: (courseId: string, payload: { title: string; order: number }) =>
      request<ModuleMutationResult>(`/instructor/courses/${courseId}/modules`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    addLesson: (
      moduleId: string,
      payload: {
        title: string;
        type: "VIDEO" | "TEXT" | "QUIZ";
        order: number;
        contentUrl?: string;
        content?: string;
        mediaAssetId?: string;
      },
    ) =>
      request<LessonMutationResult>(`/instructor/modules/${moduleId}/lessons`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    publishCourse: (courseId: string) =>
      request<CourseMutationResult>(`/instructor/courses/${courseId}/publish`, {
        method: "POST",
      }),
    uploadVideo: async (file: File) => {
      const token = useAuthStore.getState().accessToken;
      const data = new FormData();
      data.append("file", file);
      return requestJson<MediaAsset>("/instructor/uploads/video", {
        method: "POST",
        body: data,
        token,
      });
    },
  },
  admin: {
    overview: () => request<AdminOverview>("/admin/overview"),
    listUsers: () => request<AdminUserItem[]>("/admin/users"),
    listCourses: () => request<AdminCourseItem[]>("/admin/courses"),
    getCourseStructure: (courseId: string) =>
      request<CourseStructure>(`/admin/courses/${courseId}/structure`),
    listPayments: () => request<AdminPaymentItem[]>("/admin/payments"),
    createCourse: (payload: {
      title: string;
      slug: string;
      description?: string;
      category?: string;
      level?: string;
      language?: string;
      priceCents?: number;
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    }) =>
      request<AdminCourseItem>("/admin/courses", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    addModule: (courseId: string, payload: { title: string; order: number }) =>
      request<ModuleMutationResult>(`/admin/courses/${courseId}/modules`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    addLesson: (
      moduleId: string,
      payload: {
        title: string;
        type: "VIDEO" | "TEXT" | "QUIZ";
        order: number;
        contentUrl?: string;
        content?: string;
        mediaAssetId?: string;
      },
    ) =>
      request<LessonMutationResult>(`/admin/modules/${moduleId}/lessons`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listModerationCourses: () => request<ModerationCourseItem[]>("/admin/courses/moderation"),
    approveCourse: (courseId: string) =>
      request<CourseMutationResult>(`/admin/courses/${courseId}/approve`, {
        method: "POST",
      }),
    rejectCourse: (courseId: string, reason: string) =>
      request<CourseMutationResult>(
        `/admin/courses/${courseId}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ reason }),
        },
      ),
    updateUserRole: (userId: string, role: "STUDENT" | "INSTRUCTOR" | "ADMIN") =>
      request<{ id: string; role: string }>(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
  },
  social: {
    sendFriendRequest: (targetUserId: string) =>
      request<{ id: string }>("/social/friends/request", {
        method: "POST",
        body: JSON.stringify({ targetUserId }),
      }),
    acceptFriendRequest: (requestId: string) =>
      request<{ success?: boolean }>(`/social/friends/${requestId}/accept`, {
        method: "POST",
      }),
    declineFriendRequest: (requestId: string) =>
      request<{ success?: boolean }>(`/social/friends/${requestId}/decline`, {
        method: "POST",
      }),
    listFriendRequests: async (viewerId?: string) => {
      const payload = await request<unknown>("/social/friends/requests");
      return normalizeFriendRequestsPayload(payload, viewerId);
    },
    listFriends: async () => {
      const payload = await request<unknown>("/social/friends");
      const raw =
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { friends?: unknown[] }).friends)
          ? ((payload as { friends: unknown[] }).friends ?? []).map((item) => {
              if (!item || typeof item !== "object") {
                return null;
              }
              const row = item as Record<string, unknown>;
              const friend = row.friend;
              if (!friend || typeof friend !== "object") {
                return null;
              }
              return {
                ...(friend as Record<string, unknown>),
                since: typeof row.since === "string" ? row.since : undefined,
              };
            })
          : unwrapItems<unknown>(payload);
      return raw.map(normalizeFriendListItem).filter(Boolean) as FriendListItem[];
    },
  },
  chat: {
    listRooms: async () => {
      const payload = await request<unknown>("/chat/rooms");
      const raw =
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { rooms?: unknown[] }).rooms)
          ? ((payload as { rooms: unknown[] }).rooms ?? [])
          : unwrapItems<unknown>(payload);
      return raw.map(normalizeChatRoom).filter(Boolean) as ChatRoom[];
    },
    createDirectRoom: async (peerUserId: string) => {
      const payload = await request<unknown>("/chat/rooms", {
        method: "POST",
        body: JSON.stringify({ type: "DIRECT", peerUserId }),
      });
      const room = normalizeChatRoom(payload);
      if (!room) {
        throw new Error("Unexpected response when creating a room");
      }
      return room;
    },
    listMessages: async (roomId: string) => {
      const payload = await request<unknown>(`/chat/rooms/${roomId}/messages`);
      const raw =
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { messages?: unknown[] }).messages)
          ? ((payload as { messages: unknown[] }).messages ?? [])
          : unwrapItems<unknown>(payload);
      return raw.map(normalizeChatMessage).filter(Boolean) as ChatMessage[];
    },
    sendMessage: (roomId: string, body: string) =>
      request<unknown>(`/chat/rooms/${roomId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: body }),
      }),
  },
};
