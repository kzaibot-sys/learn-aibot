"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

export function useMe() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["me"],
    queryFn: api.users.me,
    enabled: hydrated && Boolean(token),
  });
}

export function useDashboardSummary() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: api.users.dashboard,
    enabled: hydrated && Boolean(token),
  });
}

export function useGamification() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["gamification", "me"],
    queryFn: api.gamification.me,
    enabled: hydrated && Boolean(token),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: api.auth.login,
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: api.auth.register,
  });
}
