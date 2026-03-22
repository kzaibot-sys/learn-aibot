"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CourseListQuery } from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";
import { useMe } from "@/lib/hooks/use-auth";

export function useCourses(params: CourseListQuery = {}) {
  return useQuery({
    queryKey: ["courses", "list", params],
    queryFn: () => api.courses.list(params),
  });
}

export function useCourseCurriculum(courseId: string | null) {
  return useQuery({
    queryKey: ["course-curriculum", courseId],
    queryFn: () => api.courses.curriculum(courseId as string),
    enabled: Boolean(courseId),
  });
}

export function useCourseRecommendations() {
  return useQuery({
    queryKey: ["courses", "recommendations"],
    queryFn: api.courses.recommendations,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => api.courses.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", "recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useCheckoutCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => api.payments.checkoutCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "me"] });
    },
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ["enrollments"],
    queryFn: api.enrollments.listMine,
  });
}

export function useMyProgress() {
  return useQuery({
    queryKey: ["progress"],
    queryFn: api.progress.mine,
  });
}

export function useMyActivity() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  const storeRole = useAuthStore((s) => s.user?.role);
  const { data: me } = useMe();
  const role = me?.role ?? storeRole;
  return useQuery({
    queryKey: ["activity"],
    queryFn: api.users.activityMine,
    enabled: hydrated && Boolean(token) && role === "STUDENT",
  });
}

export function useUpdateLessonProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      lessonId: string;
      watchedDuration: number;
      completed: boolean;
      quizScore?: number;
    }) =>
      api.progress.updateLesson(args.lessonId, {
        watchedDuration: args.watchedDuration,
        completed: args.completed,
        quizScore: args.quizScore,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useLessonQuiz(lessonId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["lesson-quiz", lessonId],
    queryFn: () => api.lessons.getQuiz(lessonId as string),
    enabled: Boolean(lessonId) && enabled,
  });
}

export function useSubmitQuiz(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { lessonId: string; answers: Record<string, string> }) =>
      api.lessons.submitQuiz(args.lessonId, { answers: args.answers }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["lesson", variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["lesson-quiz", variables.lessonId] });
    },
  });
}
