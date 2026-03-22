"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

export function useUserSearch(query: string) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["user-search", trimmed],
    queryFn: () => api.users.search(trimmed, 12),
    enabled: hydrated && Boolean(token) && trimmed.length >= 2,
    staleTime: 20_000,
  });
}

