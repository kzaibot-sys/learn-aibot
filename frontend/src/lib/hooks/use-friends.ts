"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";
import { useMe } from "@/lib/hooks/use-auth";

function useViewerId() {
  const { data: me } = useMe();
  const storeUserId = useAuthStore((s) => s.user?.id);
  return me?.id ?? storeUserId ?? undefined;
}

export function useFriendRequests() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  const viewerId = useViewerId();

  return useQuery({
    queryKey: ["friend-requests", viewerId],
    queryFn: () => api.social.listFriendRequests(viewerId),
    enabled: hydrated && Boolean(token) && Boolean(viewerId),
  });
}

export function useFriends() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ["friends"],
    queryFn: api.social.listFriends,
    enabled: hydrated && Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => api.social.sendFriendRequest(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => api.social.acceptFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useDeclineFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => api.social.declineFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}
