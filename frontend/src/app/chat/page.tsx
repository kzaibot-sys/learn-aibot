"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiClientError } from "@/lib/api/http";
import { useFriends } from "@/lib/hooks/use-friends";
import {
  useChatMessages,
  useChatRooms,
  useCreateDirectRoom,
  useSendChatMessage,
} from "@/lib/hooks/use-chat";
import { useMe } from "@/lib/hooks/use-auth";

function roomLabel(room: {
  title?: string | null;
  type?: string;
  course?: { title?: string } | null;
  peer?: { firstName?: string | null; lastName?: string | null; email?: string } | null;
}) {
  if (room.title?.trim()) {
    return room.title.trim();
  }
  if (room.type === "COURSE" && room.course?.title) {
    return room.course.title;
  }
  if (room.peer) {
    const fullName = [room.peer.firstName, room.peer.lastName].filter(Boolean).join(" ").trim();
    return fullName.length > 0 ? fullName : room.peer.email ?? "Direct chat";
  }
  return "Chat room";
}

function ChatContent() {
  const searchParams = useSearchParams();
  const peerFromQuery = searchParams.get("peer");
  const { data: me } = useMe();
  const friends = useFriends();
  const roomsQuery = useChatRooms();
  const createDirectRoom = useCreateDirectRoom();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [manualPeerId, setManualPeerId] = useState("");
  const messagesQuery = useChatMessages(selectedRoomId);
  const sendMessage = useSendChatMessage();

  const sortedMessages = useMemo(() => {
    const rows = messagesQuery.data ?? [];
    return [...rows].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }, [messagesQuery.data]);

  useEffect(() => {
    if (!peerFromQuery) {
      return;
    }
    createDirectRoom.mutate(peerFromQuery, {
      onSuccess: (room) => setSelectedRoomId(room.id),
    });
  }, [createDirectRoom, peerFromQuery]);

  const createDirectByFriend = (peerUserId: string) => {
    createDirectRoom.mutate(peerUserId, {
      onSuccess: (room) => setSelectedRoomId(room.id),
    });
  };

  const onCreateManualRoom = () => {
    const peerId = manualPeerId.trim();
    if (!peerId) {
      return;
    }
    createDirectByFriend(peerId);
    setManualPeerId("");
  };

  const onSendMessage = () => {
    const body = draft.trim();
    if (!selectedRoomId || !body) {
      return;
    }
    sendMessage.mutate(
      { roomId: selectedRoomId, body },
      {
        onSuccess: () => setDraft(""),
      },
    );
  };

  return (
    <AppShell
      title="Chat Workspace"
      subtitle="Direct messaging with your friend network and live room updates."
    >
      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr_1fr]">
        <Card className="border-[var(--line)] bg-[var(--panel)]">
          <CardHeader>
            <CardTitle>Friends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(friends.data ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No friends yet. Add friends first.</p>
            ) : (
              (friends.data ?? []).map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => createDirectByFriend(friend.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3 text-left hover:border-[var(--accent)]/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {[friend.firstName, friend.lastName].filter(Boolean).join(" ").trim() ||
                        friend.email ||
                        friend.id}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">{friend.email ?? friend.id}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      friend.isOnline
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {friend.isOnline ? "online" : "offline"}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--line)] bg-[var(--panel)]">
          <CardHeader className="pb-3">
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={manualPeerId}
                onChange={(event) => setManualPeerId(event.target.value)}
                placeholder="Open direct chat by user id"
              />
              <Button onClick={onCreateManualRoom} disabled={createDirectRoom.isPending || !manualPeerId.trim()}>
                Open
              </Button>
            </div>
            {createDirectRoom.isError && createDirectRoom.error instanceof ApiClientError ? (
              <p className="text-sm text-rose-600">{createDirectRoom.error.message}</p>
            ) : null}

            {roomsQuery.isLoading ? (
              <p className="text-sm text-[var(--muted)]">Loading rooms...</p>
            ) : null}
            {roomsQuery.isError && roomsQuery.error instanceof ApiClientError ? (
              <p className="text-sm text-rose-600">{roomsQuery.error.message}</p>
            ) : null}

            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {(roomsQuery.data ?? []).map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    selectedRoomId === room.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--line)] bg-[var(--soft)] hover:border-[var(--accent)]/40"
                  }`}
                >
                  <p className="truncate text-sm font-semibold">{roomLabel(room)}</p>
                  <p className="mt-1 truncate text-xs text-[var(--muted)]">
                    {room.lastMessagePreview ?? "No messages yet"}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--line)] bg-[var(--panel)]">
          <CardHeader className="pb-3">
            <CardTitle>{selectedRoomId ? "Messages" : "Select room"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedRoomId ? (
              <p className="text-sm text-[var(--muted)]">Pick a room from the middle column to start messaging.</p>
            ) : null}

            {selectedRoomId && messagesQuery.isLoading ? (
              <p className="text-sm text-[var(--muted)]">Loading messages...</p>
            ) : null}
            {selectedRoomId && messagesQuery.isError && messagesQuery.error instanceof ApiClientError ? (
              <p className="text-sm text-rose-600">{messagesQuery.error.message}</p>
            ) : null}

            <div className="max-h-[360px] min-h-[220px] space-y-2 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
              {selectedRoomId && sortedMessages.length === 0 && !messagesQuery.isLoading ? (
                <p className="text-sm text-[var(--muted)]">No messages yet.</p>
              ) : null}
              {sortedMessages.map((message) => {
                const mine = message.senderId === me?.id;
                return (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      mine
                        ? "ml-auto bg-[var(--accent)] text-white"
                        : "mr-auto border border-[var(--line)] bg-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-white/80" : "text-[var(--muted)]"}`}>
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && onSendMessage()}
                placeholder="Type message..."
                disabled={!selectedRoomId || sendMessage.isPending}
              />
              <Button
                onClick={onSendMessage}
                disabled={!selectedRoomId || !draft.trim() || sendMessage.isPending}
              >
                {sendMessage.isPending ? "Sending..." : "Send"}
              </Button>
            </div>
            {sendMessage.isError && sendMessage.error instanceof ApiClientError ? (
              <p className="text-sm text-rose-600">{sendMessage.error.message}</p>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatContent />
    </AuthGuard>
  );
}
