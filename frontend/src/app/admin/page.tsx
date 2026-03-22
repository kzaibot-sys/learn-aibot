"use client";

import { useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/providers/language-provider";
import { useMe } from "@/lib/hooks/use-auth";
import {
  describeApiError,
  useAdminAddLesson,
  useAdminAddModule,
  useAdminCourseStructure,
  useAdminCourses,
  useAdminCreateCourse,
  useAdminOverview,
  useAdminPayments,
  useAdminUsers,
  useUploadInstructorVideo,
} from "@/lib/hooks/use-instructor-admin";

const T = {
  en: {
    title: "Admin workspace",
    subtitle: "Step flow: course -> module -> lesson + video upload + users/payments monitor.",
    deny: "Admin access only",
    checking: "Checking access...",
    chooseCourse: "Choose course",
    createCourse: "Create course",
    addModule: "Add module",
    uploadVideo: "Upload video",
    addLesson: "Add lesson",
    noCourses: "No courses yet",
    noModules: "No modules yet",
    usersTitle: "Users",
    coursesTitle: "Courses",
    paymentsTitle: "Payments",
    noUsers: "No users found",
    noCoursesList: "No courses found",
    noPayments: "No payments yet",
  },
  ru: {
    title: "Админ-панель",
    subtitle: "Пошаговый flow: курс -> модуль -> урок + видео + мониторинг.",
    deny: "Только для администратора",
    checking: "Проверяем доступ...",
    chooseCourse: "Выбор курса",
    createCourse: "Создать курс",
    addModule: "Добавить модуль",
    uploadVideo: "Загрузить видео",
    addLesson: "Добавить урок",
    noCourses: "Курсов пока нет",
    noModules: "Модулей пока нет",
    usersTitle: "Пользователи",
    coursesTitle: "Курсы",
    paymentsTitle: "Платежи",
    noUsers: "Пользователи не найдены",
    noCoursesList: "Курсы не найдены",
    noPayments: "Платежей пока нет",
  },
  kz: {
    title: "Әкімші панелі",
    subtitle: "Қадамдық flow: курс -> модуль -> сабақ + бейне + мониторинг.",
    deny: "Тек әкімші үшін",
    checking: "Қолжетімділік тексерілуде...",
    chooseCourse: "Курсты таңдау",
    createCourse: "Курс құру",
    addModule: "Модуль қосу",
    uploadVideo: "Бейнені жүктеу",
    addLesson: "Сабақ қосу",
    noCourses: "Курс әзірше жоқ",
    noModules: "Модуль әзірше жоқ",
    usersTitle: "Пайдаланушылар",
    coursesTitle: "Курстар",
    paymentsTitle: "Төлемдер",
    noUsers: "Пайдаланушылар табылмады",
    noCoursesList: "Курстар табылмады",
    noPayments: "Төлемдер әзірше жоқ",
  },
} as const;

type L = keyof typeof T;

function slugify(v: string) {
  return v.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function money(locale: L, cents: number, currency = "USD") {
  const loc = locale === "kz" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-US";
  return new Intl.NumberFormat(loc, { style: "currency", currency }).format(cents / 100);
}

function AdminPageContent() {
  const { data: me, isLoading } = useMe();
  const { locale } = useLanguage();
  const l = locale as L;
  const t = T[l];

  const overview = useAdminOverview();
  const users = useAdminUsers();
  const courses = useAdminCourses();
  const payments = useAdminPayments();
  const createCourse = useAdminCreateCourse();
  const addModule = useAdminAddModule();
  const addLesson = useAdminAddLesson();
  const uploadVideo = useUploadInstructorVideo();

  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [courseForm, setCourseForm] = useState({ title: "", slug: "", priceCents: "0" });
  const [moduleForm, setModuleForm] = useState({ title: "", order: "1" });
  const [lessonForm, setLessonForm] = useState({
    title: "",
    type: "VIDEO" as "VIDEO" | "TEXT" | "QUIZ",
    order: "1",
    contentUrl: "",
    content: "",
    mediaAssetId: "",
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const list = courses.data ?? [];
  const activeCourseId = list.some((x) => x.id === courseId) ? courseId : (list[0]?.id ?? "");
  const structure = useAdminCourseStructure(activeCourseId || null);
  const modules = structure.data?.modules ?? [];
  const activeModuleId = modules.some((x) => x.id === moduleId) ? moduleId : (modules[0]?.id ?? "");

  async function onCreateCourse() {
    setMessage(null);
    try {
      const c = await createCourse.mutateAsync({
        title: courseForm.title.trim(),
        slug: courseForm.slug.trim() || slugify(courseForm.title),
        priceCents: Number(courseForm.priceCents || "0"),
      });
      setCourseId(c.id);
      setMessage(`${t.createCourse}: ${c.title}`);
    } catch (e) {
      setMessage(describeApiError(e, "Failed"));
    }
  }

  async function onAddModule() {
    setMessage(null);
    if (!activeCourseId) return;
    try {
      const m = await addModule.mutateAsync({
        courseId: activeCourseId,
        title: moduleForm.title.trim(),
        order: Number(moduleForm.order || "1"),
      });
      setModuleId(m.id);
      setMessage(`${t.addModule}: ${m.title}`);
    } catch (e) {
      setMessage(describeApiError(e, "Failed"));
    }
  }

  async function onUpload() {
    setMessage(null);
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    try {
      const a = await uploadVideo.mutateAsync(file);
      setLessonForm((p) => ({ ...p, mediaAssetId: a.id, contentUrl: a.streamUrl }));
      setMessage(`${t.uploadVideo}: ${a.originalName}`);
    } catch (e) {
      setMessage(describeApiError(e, "Failed"));
    }
  }

  async function onAddLesson() {
    setMessage(null);
    if (!activeModuleId) return;
    try {
      const x = await addLesson.mutateAsync({
        moduleId: activeModuleId,
        title: lessonForm.title.trim(),
        type: lessonForm.type,
        order: Number(lessonForm.order || "1"),
        contentUrl: lessonForm.contentUrl || undefined,
        content: lessonForm.content || undefined,
        mediaAssetId: lessonForm.mediaAssetId || undefined,
      });
      setMessage(`${t.addLesson}: ${x.title}`);
    } catch (e) {
      setMessage(describeApiError(e, "Failed"));
    }
  }

  if (isLoading) return <p className="p-6 text-sm text-[var(--muted)]">{t.checking}</p>;
  if (me?.role !== "ADMIN") {
    return (
      <AppShell title={t.deny} subtitle={t.deny}>
        <Card><CardContent className="p-6 text-sm">{t.deny}</CardContent></Card>
      </AppShell>
    );
  }

  return (
    <AppShell title={t.title} subtitle={t.subtitle}>
      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 text-sm">{overview.data?.widgets.totalUsers ?? 0} users</CardContent></Card>
        <Card><CardContent className="p-4 text-sm">{overview.data?.widgets.totalCourses ?? 0} courses</CardContent></Card>
        <Card><CardContent className="p-4 text-sm">{overview.data?.widgets.publishedCourses ?? 0} published</CardContent></Card>
        <Card><CardContent className="p-4 text-sm">{money(l, overview.data?.widgets.totalRevenueCents ?? 0)}</CardContent></Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>{t.createCourse}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <label className="text-xs text-[var(--muted)]">{t.chooseCourse}</label>
            <select value={activeCourseId} onChange={(e) => { setCourseId(e.target.value); setModuleId(""); }} className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 text-sm">
              {list.length === 0 ? <option value="">{t.noCourses}</option> : null}
              {list.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.status})</option>)}
            </select>
            <Input value={courseForm.title} onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value, slug: p.slug || slugify(e.target.value) }))} placeholder="Title" />
            <Input value={courseForm.slug} onChange={(e) => setCourseForm((p) => ({ ...p, slug: e.target.value }))} placeholder="Slug" />
            <Input type="number" value={courseForm.priceCents} onChange={(e) => setCourseForm((p) => ({ ...p, priceCents: e.target.value }))} placeholder="Price cents" />
            <button type="button" onClick={onCreateCourse} disabled={createCourse.isPending} className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{createCourse.isPending ? "..." : t.createCourse}</button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t.addModule}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={moduleForm.title} onChange={(e) => setModuleForm((p) => ({ ...p, title: e.target.value }))} placeholder="Module title" />
            <Input type="number" value={moduleForm.order} onChange={(e) => setModuleForm((p) => ({ ...p, order: e.target.value }))} placeholder="Order" />
            <button type="button" onClick={onAddModule} disabled={addModule.isPending || !activeCourseId} className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{addModule.isPending ? "..." : t.addModule}</button>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>{t.uploadVideo}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input ref={inputRef} type="file" accept="video/*" className="block w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm" />
            <button type="button" onClick={onUpload} disabled={uploadVideo.isPending} className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{uploadVideo.isPending ? "..." : t.uploadVideo}</button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t.addLesson}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <select value={activeModuleId} onChange={(e) => setModuleId(e.target.value)} className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 text-sm">
              {modules.length === 0 ? <option value="">{t.noModules}</option> : null}
              {modules.map((m) => <option key={m.id} value={m.id}>#{m.order} - {m.title}</option>)}
            </select>
            <Input value={lessonForm.title} onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))} placeholder="Lesson title" />
            <select value={lessonForm.type} onChange={(e) => setLessonForm((p) => ({ ...p, type: e.target.value as "VIDEO" | "TEXT" | "QUIZ" }))} className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 text-sm">
              <option value="VIDEO">VIDEO</option><option value="TEXT">TEXT</option><option value="QUIZ">QUIZ</option>
            </select>
            <Input type="number" value={lessonForm.order} onChange={(e) => setLessonForm((p) => ({ ...p, order: e.target.value }))} placeholder="Order" />
            <Input value={lessonForm.mediaAssetId} onChange={(e) => setLessonForm((p) => ({ ...p, mediaAssetId: e.target.value }))} placeholder="Media asset ID" />
            <Input value={lessonForm.contentUrl} onChange={(e) => setLessonForm((p) => ({ ...p, contentUrl: e.target.value }))} placeholder="Content URL" />
            <textarea value={lessonForm.content} onChange={(e) => setLessonForm((p) => ({ ...p, content: e.target.value }))} placeholder="Text content" className="min-h-[100px] w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm" />
            <button type="button" onClick={onAddLesson} disabled={addLesson.isPending || !activeModuleId} className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{addLesson.isPending ? "..." : t.addLesson}</button>
          </CardContent>
        </Card>
      </section>

      {message ? <p className="mt-4 text-sm">{message}</p> : null}

      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card><CardHeader><CardTitle>{t.usersTitle}</CardTitle></CardHeader><CardContent className="space-y-2">{(users.data ?? []).slice(0, 6).map((u) => <div key={u.id} className="text-sm">{u.email} · {u.role}</div>)}{(users.data ?? []).length === 0 ? <p className="text-sm text-[var(--muted)]">{t.noUsers}</p> : null}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t.coursesTitle}</CardTitle></CardHeader><CardContent className="space-y-2">{list.slice(0, 6).map((c) => <div key={c.id} className="text-sm">{c.title} · {c.status}</div>)}{list.length === 0 ? <p className="text-sm text-[var(--muted)]">{t.noCoursesList}</p> : null}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t.paymentsTitle}</CardTitle></CardHeader><CardContent className="space-y-2">{(payments.data ?? []).slice(0, 6).map((p) => <div key={p.id} className="text-sm">{p.course.title} · {p.user.email} · {money(l, p.amountCents, p.currency)}</div>)}{(payments.data ?? []).length === 0 ? <p className="text-sm text-[var(--muted)]">{t.noPayments}</p> : null}</CardContent></Card>
      </section>
    </AppShell>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminPageContent />
    </AuthGuard>
  );
}
