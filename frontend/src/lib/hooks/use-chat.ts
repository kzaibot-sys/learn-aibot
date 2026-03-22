"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

const MESSAGES_POLL_MS = 5000;

export function useChatRooms() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ["chat-rooms"],
    queryFn: api.chat.listRooms,
    enabled: hydrated && Boolean(token),
    refetchInterval: 10_000,
  });
}

export function useChatMessages(roomId: string | null) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ["chat-messages", roomId],
    queryFn: () => api.chat.listMessages(roomId as string),
    enabled: hydrated && Boolean(token) && Boolean(roomId),
    refetchInterval: MESSAGES_POLL_MS,
  });
}

export function useCreateDirectRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (peerUserId: string) => api.chat.createDirectRoom(peerUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, body }: { roomId: string; body: string }) =>
      api.chat.sendMessage(roomId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
  });
}
