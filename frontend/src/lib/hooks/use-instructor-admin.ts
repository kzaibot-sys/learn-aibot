"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/http";

function invalidateCourseData(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["courses"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "course-structure"] });
  queryClient.invalidateQueries({ queryKey: ["instructor", "courses"] });
  queryClient.invalidateQueries({ queryKey: ["instructor", "course-structure"] });
}

function describeApiError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    const parts = [error.code ? `code ${error.code}` : null, error.requestId ? `request ${error.requestId}` : null].filter(
      Boolean,
    );
    return parts.length > 0 ? `${error.message} (${parts.join(", ")})` : error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.instructor.createCourse,
    onSuccess: () => invalidateCourseData(queryClient),
  });
}

export function useInstructorManagedCourses() {
  return useQuery({
    queryKey: ["instructor", "courses"],
    queryFn: api.instructor.listManagedCourses,
  });
}

export function useInstructorCourseStructure(courseId?: string | null) {
  return useQuery({
    queryKey: ["instructor", "course-structure", courseId],
    queryFn: () => api.instructor.getCourseStructure(courseId as string),
    enabled: Boolean(courseId),
  });
}

export function useUploadInstructorVideo() {
  return useMutation({
    mutationFn: (file: File) => api.instructor.uploadVideo(file),
  });
}

export function useAddModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { courseId: string; title: string; order: number }) =>
      api.instructor.addModule(args.courseId, {
        title: args.title,
        order: args.order,
      }),
    onSuccess: () => invalidateCourseData(queryClient),
  });
}

export function useAddLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      moduleId: string;
      title: string;
      type: "VIDEO" | "TEXT" | "QUIZ";
      order: number;
      contentUrl?: string;
      content?: string;
      mediaAssetId?: string;
    }) =>
      api.instructor.addLesson(args.moduleId, {
        title: args.title,
        type: args.type,
        order: args.order,
        contentUrl: args.contentUrl,
        content: args.content,
        mediaAssetId: args.mediaAssetId,
      }),
    onSuccess: () => invalidateCourseData(queryClient),
  });
}

export function usePublishCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => api.instructor.publishCourse(courseId),
    onSuccess: () => invalidateCourseData(queryClient),
  });
}

export function useModerationCourses() {
  return useQuery({
    queryKey: ["moderation-courses"],
    queryFn: api.admin.listModerationCourses,
  });
}

export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: api.admin.overview,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: api.admin.listUsers,
  });
}

export function useAdminCourses() {
  return useQuery({
    queryKey: ["admin", "courses"],
    queryFn: api.admin.listCourses,
  });
}

export function useAdminCourseStructure(courseId?: string | null) {
  return useQuery({
    queryKey: ["admin", "course-structure", courseId],
    queryFn: () => api.admin.getCourseStructure(courseId as string),
    enabled: Boolean(courseId),
  });
}

export function useAdminPayments() {
  return useQuery({
    queryKey: ["admin", "payments"],
    queryFn: api.admin.listPayments,
  });
}

export function useAdminCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.admin.createCourse,
    onSuccess: () => {
      invalidateCourseData(queryClient);
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useAdminAddModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { courseId: string; title: string; order: number }) =>
      api.admin.addModule(args.courseId, {
        title: args.title,
        order: args.order,
      }),
    onSuccess: () => {
      invalidateCourseData(queryClient);
    },
  });
}

export function useAdminAddLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      moduleId: string;
      title: string;
      type: "VIDEO" | "TEXT" | "QUIZ";
      order: number;
      contentUrl?: string;
      content?: string;
      mediaAssetId?: string;
    }) =>
      api.admin.addLesson(args.moduleId, {
        title: args.title,
        type: args.type,
        order: args.order,
        contentUrl: args.contentUrl,
        content: args.content,
        mediaAssetId: args.mediaAssetId,
      }),
    onSuccess: () => {
      invalidateCourseData(queryClient);
    },
  });
}

export function useApproveCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => api.admin.approveCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-courses"] });
      invalidateCourseData(queryClient);
    },
  });
}

export function useRejectCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { courseId: string; reason: string }) =>
      api.admin.rejectCourse(args.courseId, args.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-courses"] });
      invalidateCourseData(queryClient);
    },
  });
}

export { describeApiError };
