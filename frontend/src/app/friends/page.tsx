"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiClientError } from "@/lib/api/http";
import {
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useFriendRequests,
  useFriends,
  useSendFriendRequest,
} from "@/lib/hooks/use-friends";
import { useUserSearch } from "@/lib/hooks/use-users";

function formatName(input: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  id: string;
}) {
  const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ").trim();
  return fullName.length > 0 ? fullName : input.email ?? input.id;
}

function formatLastSeen(lastSeenAt?: string | null) {
  if (!lastSeenAt) {
    return "offline";
  }
  const date = new Date(lastSeenAt);
  if (Number.isNaN(date.getTime())) {
    return "offline";
  }
  return `last seen ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function FriendsContent() {
  const [query, setQuery] = useState("");
  const search = useUserSearch(query);
  const friendRequests = useFriendRequests();
  const friends = useFriends();
  const sendRequest = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const decline = useDeclineFriendRequest();

  const incoming = useMemo(
    () => (friendRequests.data?.incoming ?? []).filter((item) => item.status === "PENDING"),
    [friendRequests.data?.incoming],
  );
  const outgoing = useMemo(
    () => (friendRequests.data?.outgoing ?? []).filter((item) => item.status === "PENDING"),
    [friendRequests.data?.outgoing],
  );

  const mainError =
    friendRequests.error instanceof ApiClientError
      ? friendRequests.error.message
      : friends.error instanceof ApiClientError
        ? friends.error.message
        : null;

  return (
    <AppShell
      title="Friends Network"
      subtitle="Search users by email or name, manage requests, and jump to direct chat."
    >
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-[var(--line)] bg-[var(--panel)]">
          <CardHeader>
            <CardTitle>Find users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, email, or user id"
              />
            </div>

            {search.isFetching ? (
              <p className="text-sm text-[var(--muted)]">Searching users...</p>
            ) : null}
            {search.isError && search.error instanceof ApiClientError ? (
              <p className="text-sm text-rose-600">{search.error.message}</p>
            ) : null}

            {query.trim().length >= 2 && !search.isFetching && (search.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--muted)]">No users found.</p>
            ) : null}

            <div className="space-y-2">
              {(search.data ?? []).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{formatName(user)}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendRequest.mutate(user.id)}
                    disabled={sendRequest.isPending}
                  >
                    Add friend
                  </Button>
                </div>
              ))}
            </div>

            {sendRequest.isError && sendRequest.error instanceof ApiClientError ? (
              <p className="text-sm text-rose-600">{sendRequest.error.message}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-[var(--line)] bg-[var(--panel)]">
          <CardHeader>
            <CardTitle>Pending requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Incoming</p>
              {incoming.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No incoming requests.</p>
              ) : (
                incoming.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3"
                  >
                    <p className="text-sm font-semibold">
                      {formatName(
                        request.fromUser ?? {
                          id: request.fromUserId,
                        },
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{request.fromUser?.email ?? request.fromUserId}</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => accept.mutate(request.id)} disabled={accept.isPending || decline.isPending}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decline.mutate(request.id)}
                        disabled={accept.isPending || decline.isPending}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Outgoing</p>
              {outgoing.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No outgoing requests.</p>
              ) : (
                outgoing.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3"
                  >
                    <p className="text-sm font-semibold">
                      {formatName(
                        request.toUser ?? {
                          id: request.toUserId,
                        },
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{request.toUser?.email ?? request.toUserId}</p>
                  </div>
                ))
              )}
            </div>

            {(accept.isError || decline.isError) && (
              <p className="text-sm text-rose-600">
                {accept.error instanceof ApiClientError
                  ? accept.error.message
                  : decline.error instanceof ApiClientError
                    ? decline.error.message
                    : "Failed to update request status."}
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {mainError ? (
        <Card className="mt-5 border-rose-300/60 bg-rose-50">
          <CardContent className="pt-6">
            <p className="text-sm text-rose-700">{mainError}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-5 border-[var(--line)] bg-[var(--panel)]">
        <CardHeader>
          <CardTitle>My friends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(friends.data ?? []).length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No friends yet.</p>
          ) : (
            (friends.data ?? []).map((friend) => (
              <div
                key={friend.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{formatName(friend)}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        friend.isOnline
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {friend.isOnline ? "online" : "offline"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">{friend.email ?? friend.id}</p>
                  <p className="text-xs text-[var(--muted)]">{formatLastSeen(friend.lastSeenAt)}</p>
                </div>
                <Link
                  href={`/chat?peer=${encodeURIComponent(friend.id)}`}
                  className="inline-flex items-center rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
                >
                  Open chat
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

export default function FriendsPage() {
  return (
    <AuthGuard>
      <FriendsContent />
    </AuthGuard>
  );
}

