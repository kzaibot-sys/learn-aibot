"use client";

import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClientError } from "@/lib/api/http";
import { formatLearnerActivityLabel, formatLearnerActivityTime } from "@/lib/learner-activity";
import { useMyActivity } from "@/lib/hooks/use-courses";
import { useMe } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/lib/store/auth-store";

const DISPLAY_LIMIT = 10;

export function RecentActivitySection() {
  const fallbackUser = useAuthStore((s) => s.user);
  const { data: me } = useMe();
  const role = me?.role ?? fallbackUser?.role;
  const isStudent = role === "STUDENT";

  const { data: events, isLoading, isError, error } = useMyActivity();

  if (!isStudent) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5 text-primary" />
            Последняя активность
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-xl border border-transparent bg-slate-50/80 p-3"
            >
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
          <p className="text-sm text-muted-foreground">Загрузка активности...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Не удалось загрузить активность.";
    return (
      <Card className="mt-8 border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5 text-primary" />
            Последняя активность
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{message}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Endpoint: <code className="rounded bg-muted px-1 py-0.5">GET /users/me/activity</code>
          </p>
        </CardContent>
      </Card>
    );
  }

  const list = (events ?? []).slice(0, DISPLAY_LIMIT);

  if (list.length === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5 text-primary" />
            Последняя активность
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Пока нет событий: запишитесь на курс или начните урок — здесь появятся последние действия.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5 text-primary" />
          Последняя активность
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {list.map((item, index) => (
            <li
              key={`${item.type}-${item.timestamp}-${item.lessonId ?? item.courseId}-${index}`}
              className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
            >
              <p className="text-sm font-medium leading-snug">{formatLearnerActivityLabel(item)}</p>
              <time
                className="shrink-0 text-xs text-muted-foreground sm:text-right"
                dateTime={item.timestamp}
              >
                {formatLearnerActivityTime(item.timestamp)}
              </time>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
