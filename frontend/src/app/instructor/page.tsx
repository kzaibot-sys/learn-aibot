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
  useAddLesson,
  useAddModule,
  useCreateCourse,
  useInstructorCourseStructure,
  useInstructorManagedCourses,
  usePublishCourse,
  useUploadInstructorVideo,
} from "@/lib/hooks/use-instructor-admin";

const COPY = {
  en: {
    pageTitle: "Instructor workspace",
    pageSubtitle:
      "Create courses in a guided flow: choose a course, add modules, upload video, add lessons, and publish when ready.",
    checkingAccess: "Checking access...",
    guardTitle: "Instructor access only",
    guardSubtitle: "This page is available only for users with the INSTRUCTOR role.",
    signedInAs: "Signed in as",
    noCourses: "No courses yet. Create your first course below.",
    currentCourse: "Current course",
    currentModule: "Current module",
    latestAsset: "Latest asset",
    notSelected: "Not selected",
    noUpload: "No upload yet",
    step1Title: "Step 1. Create or choose a course",
    chooseCourse: "Choose course",
    createCourseTitle: "Create new course",
    title: "Title",
    slug: "Slug",
    description: "Description",
    category: "Category",
    level: "Level",
    language: "Language",
    priceCents: "Price, cents",
    createCourseButton: "Create course",
    creatingCourse: "Creating...",
    courseCreated: "Course created successfully:",
    courseFailed: "Failed to create course.",
    publishTitle: "Publish selected course",
    publishHint: "Publishing requires at least one module and one lesson.",
    publishButton: "Publish course",
    publishing: "Publishing...",
    publishDone: "Course status:",
    publishFailed: "Failed to publish course.",
    chooseCourseFirst: "Please choose a course first.",
    step2Title: "Step 2. Add module",
    moduleTitle: "Module title",
    order: "Order",
    addModuleButton: "Add module",
    addingModule: "Adding...",
    moduleCreated: "Module created successfully:",
    moduleFailed: "Failed to add module.",
    step3Title: "Step 3. Upload video",
    uploadHint: "After upload, media asset id and stream URL are filled into lesson form.",
    chooseVideoFile: "Choose video file first.",
    pleaseChooseVideoFile: "Please choose a video file.",
    uploadVideoButton: "Upload video",
    uploadingVideo: "Uploading...",
    uploaded: "Uploaded:",
    uploadFailed: "Video upload failed.",
    openStreamUrl: "Open stream URL",
    step4Title: "Step 4. Add lesson",
    chooseModule: "Choose module",
    noModules: "No modules in selected course yet.",
    lessonTitle: "Lesson title",
    lessonType: "Type",
    contentUrl: "Content URL",
    textContent: "Text content",
    mediaAssetId: "Media asset ID",
    addLessonButton: "Add lesson",
    addingLesson: "Adding...",
    lessonCreated: "Lesson created successfully:",
    lessonFailed: "Failed to add lesson.",
    chooseModuleFirst: "Please choose a module first.",
    videoNeedsAsset: "Video lessons require media asset ID or content URL.",
    textNeedsContent: "Text lessons require text content.",
    videoOption: "Video",
    textOption: "Text",
    quizOption: "Quiz",
  },
  ru: {
    pageTitle: "Рабочее пространство преподавателя",
    pageSubtitle:
      "Пошаговый сценарий: выберите курс, добавьте модули, загрузите видео, создайте уроки и опубликуйте курс.",
    checkingAccess: "Проверяем доступ...",
    guardTitle: "Доступ только для преподавателя",
    guardSubtitle: "Эта страница доступна только пользователям с ролью INSTRUCTOR.",
    signedInAs: "Вы вошли как",
    noCourses: "Курсов пока нет. Создайте первый курс ниже.",
    currentCourse: "Текущий курс",
    currentModule: "Текущий модуль",
    latestAsset: "Последний файл",
    notSelected: "Не выбрано",
    noUpload: "Загрузок пока нет",
    step1Title: "Шаг 1. Создайте или выберите курс",
    chooseCourse: "Выбор курса",
    createCourseTitle: "Создание нового курса",
    title: "Название",
    slug: "Slug",
    description: "Описание",
    category: "Категория",
    level: "Уровень",
    language: "Язык",
    priceCents: "Цена, центы",
    createCourseButton: "Создать курс",
    creatingCourse: "Создаём...",
    courseCreated: "Курс успешно создан:",
    courseFailed: "Не удалось создать курс.",
    publishTitle: "Публикация выбранного курса",
    publishHint: "Для публикации нужен хотя бы один модуль и один урок.",
    publishButton: "Опубликовать курс",
    publishing: "Публикуем...",
    publishDone: "Статус курса:",
    publishFailed: "Не удалось опубликовать курс.",
    chooseCourseFirst: "Сначала выберите курс.",
    step2Title: "Шаг 2. Добавьте модуль",
    moduleTitle: "Название модуля",
    order: "Порядок",
    addModuleButton: "Добавить модуль",
    addingModule: "Добавляем...",
    moduleCreated: "Модуль успешно создан:",
    moduleFailed: "Не удалось добавить модуль.",
    step3Title: "Шаг 3. Загрузите видео",
    uploadHint: "После загрузки media asset id и stream URL автоматически попадут в форму урока.",
    chooseVideoFile: "Сначала выберите видеофайл.",
    pleaseChooseVideoFile: "Пожалуйста, выберите видеофайл.",
    uploadVideoButton: "Загрузить видео",
    uploadingVideo: "Загружаем...",
    uploaded: "Загружено:",
    uploadFailed: "Не удалось загрузить видео.",
    openStreamUrl: "Открыть stream URL",
    step4Title: "Шаг 4. Добавьте урок",
    chooseModule: "Выбор модуля",
    noModules: "В выбранном курсе пока нет модулей.",
    lessonTitle: "Название урока",
    lessonType: "Тип",
    contentUrl: "URL контента",
    textContent: "Текст урока",
    mediaAssetId: "Media asset ID",
    addLessonButton: "Добавить урок",
    addingLesson: "Добавляем...",
    lessonCreated: "Урок успешно создан:",
    lessonFailed: "Не удалось добавить урок.",
    chooseModuleFirst: "Сначала выберите модуль.",
    videoNeedsAsset: "Для видеоурока нужен media asset ID или URL контента.",
    textNeedsContent: "Для текстового урока нужен текстовый контент.",
    videoOption: "Видео",
    textOption: "Текст",
    quizOption: "Тест",
  },
  kz: {
    pageTitle: "Оқытушының жұмыс кеңістігі",
    pageSubtitle:
      "Қадамдық сценарий: курсты таңдаңыз, модуль қосыңыз, бейне жүктеңіз, сабақ жасаңыз және курсты жариялаңыз.",
    checkingAccess: "Қолжетімділік тексерілуде...",
    guardTitle: "Тек оқытушыға қолжетімді",
    guardSubtitle: "Бұл бет тек INSTRUCTOR рөлі бар пайдаланушыларға арналған.",
    signedInAs: "Кіруіңіз:",
    noCourses: "Әзірше курс жоқ. Төменде бірінші курсты жасаңыз.",
    currentCourse: "Ағымдағы курс",
    currentModule: "Ағымдағы модуль",
    latestAsset: "Соңғы файл",
    notSelected: "Таңдалмаған",
    noUpload: "Жүктеу әлі жоқ",
    step1Title: "1-қадам. Курсты құру немесе таңдау",
    chooseCourse: "Курсты таңдау",
    createCourseTitle: "Жаңа курс құру",
    title: "Атауы",
    slug: "Slug",
    description: "Сипаттама",
    category: "Санат",
    level: "Деңгей",
    language: "Тіл",
    priceCents: "Бағасы, цент",
    createCourseButton: "Курс құру",
    creatingCourse: "Құрылуда...",
    courseCreated: "Курс сәтті құрылды:",
    courseFailed: "Курсты құру мүмкін болмады.",
    publishTitle: "Таңдалған курсты жариялау",
    publishHint: "Жариялау үшін кемінде бір модуль және бір сабақ қажет.",
    publishButton: "Курсты жариялау",
    publishing: "Жариялануда...",
    publishDone: "Курс мәртебесі:",
    publishFailed: "Курсты жариялау мүмкін болмады.",
    chooseCourseFirst: "Әуелі курсты таңдаңыз.",
    step2Title: "2-қадам. Модуль қосу",
    moduleTitle: "Модуль атауы",
    order: "Реті",
    addModuleButton: "Модуль қосу",
    addingModule: "Қосылуда...",
    moduleCreated: "Модуль сәтті құрылды:",
    moduleFailed: "Модульді қосу мүмкін болмады.",
    step3Title: "3-қадам. Бейнені жүктеу",
    uploadHint: "Жүктегеннен кейін media asset id және stream URL сабақ формасына автоматты түрде толтырылады.",
    chooseVideoFile: "Әуелі бейнефайл таңдаңыз.",
    pleaseChooseVideoFile: "Өтінеміз, бейнефайл таңдаңыз.",
    uploadVideoButton: "Бейнені жүктеу",
    uploadingVideo: "Жүктелуде...",
    uploaded: "Жүктелді:",
    uploadFailed: "Бейнені жүктеу мүмкін болмады.",
    openStreamUrl: "Stream URL ашу",
    step4Title: "4-қадам. Сабақ қосу",
    chooseModule: "Модульді таңдау",
    noModules: "Таңдалған курста әлі модуль жоқ.",
    lessonTitle: "Сабақ атауы",
    lessonType: "Түрі",
    contentUrl: "Контент URL",
    textContent: "Мәтіндік контент",
    mediaAssetId: "Media asset ID",
    addLessonButton: "Сабақ қосу",
    addingLesson: "Қосылуда...",
    lessonCreated: "Сабақ сәтті құрылды:",
    lessonFailed: "Сабақты қосу мүмкін болмады.",
    chooseModuleFirst: "Әуелі модульді таңдаңыз.",
    videoNeedsAsset: "Видео сабаққа media asset ID немесе контент URL қажет.",
    textNeedsContent: "Мәтіндік сабаққа мәтіндік контент қажет.",
    videoOption: "Бейне",
    textOption: "Мәтін",
    quizOption: "Тест",
  },
} as const;

type Locale = keyof typeof COPY;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  if (sizeBytes < 1024 * 1024 * 1024) return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(sizeBytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function InstructorContent() {
  const { data: me, isLoading: meLoading } = useMe();
  const { locale } = useLanguage();
  const lang = (locale in COPY ? locale : "en") as Locale;
  const t = COPY[lang];

  const managedCourses = useInstructorManagedCourses();
  const createCourse = useCreateCourse();
  const addModule = useAddModule();
  const addLesson = useAddLesson();
  const publishCourse = usePublishCourse();
  const uploadVideo = useUploadInstructorVideo();

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");

  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    description: "",
    category: "",
    level: "",
    language: "",
    priceCents: "0",
  });
  const [moduleForm, setModuleForm] = useState({
    title: "",
    order: "1",
  });
  const [lessonForm, setLessonForm] = useState({
    title: "",
    type: "VIDEO" as "VIDEO" | "TEXT" | "QUIZ",
    order: "1",
    contentUrl: "",
    content: "",
    mediaAssetId: "",
  });

  const [courseMessage, setCourseMessage] = useState<string | null>(null);
  const [moduleMessage, setModuleMessage] = useState<string | null>(null);
  const [lessonMessage, setLessonMessage] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const [uploadedAsset, setUploadedAsset] = useState<{
    id: string;
    originalName: string;
    streamUrl: string;
    sizeBytes: number;
  } | null>(null);

  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const courses = managedCourses.data ?? [];
  const activeCourseId = courses.some((course) => course.id === selectedCourseId)
    ? selectedCourseId
    : (courses[0]?.id ?? "");
  const selectedCourse = courses.find((course) => course.id === activeCourseId) ?? null;

  const structure = useInstructorCourseStructure(activeCourseId || null);
  const modules = structure.data?.modules ?? [];
  const activeModuleId = modules.some((module) => module.id === selectedModuleId)
    ? selectedModuleId
    : (modules[0]?.id ?? "");
  const selectedModule = modules.find((module) => module.id === activeModuleId) ?? null;

  async function submitCourse() {
    setCourseMessage(null);
    const title = courseForm.title.trim();
    const slug = courseForm.slug.trim() || slugify(courseForm.title);
    const priceCents = Number(courseForm.priceCents || "0");

    if (title.length < 3 || slug.length < 3 || Number.isNaN(priceCents) || priceCents < 0) {
      setCourseMessage(t.courseFailed);
      return;
    }

    try {
      const created = await createCourse.mutateAsync({
        title,
        slug,
        description: courseForm.description.trim() || undefined,
        category: courseForm.category.trim() || undefined,
        level: courseForm.level.trim() || undefined,
        language: courseForm.language.trim() || undefined,
        priceCents,
      });
      setSelectedCourseId(created.id);
      setCourseMessage(`${t.courseCreated} ${created.title}`);
    } catch (error) {
      setCourseMessage(describeApiError(error, t.courseFailed));
    }
  }

  async function submitModule() {
    setModuleMessage(null);
    if (!activeCourseId) {
      setModuleMessage(t.chooseCourseFirst);
      return;
    }

    const title = moduleForm.title.trim();
    const order = Number(moduleForm.order || "0");
    if (title.length < 2 || Number.isNaN(order) || order < 1) {
      setModuleMessage(t.moduleFailed);
      return;
    }

    try {
      const created = await addModule.mutateAsync({
        courseId: activeCourseId,
        title,
        order,
      });
      setSelectedModuleId(created.id);
      setModuleMessage(`${t.moduleCreated} ${created.title}`);
      setModuleForm((prev) => ({ ...prev, title: "" }));
    } catch (error) {
      setModuleMessage(describeApiError(error, t.moduleFailed));
    }
  }

  async function submitVideo() {
    setUploadMessage(null);
    const file = videoInputRef.current?.files?.[0] ?? null;

    if (!file) {
      setUploadMessage(t.chooseVideoFile);
      return;
    }
    if (!file.type.startsWith("video/")) {
      setUploadMessage(t.pleaseChooseVideoFile);
      return;
    }

    try {
      const asset = await uploadVideo.mutateAsync(file);
      setUploadedAsset(asset);
      setLessonForm((prev) => ({
        ...prev,
        mediaAssetId: asset.id,
        contentUrl: asset.streamUrl,
      }));
      setUploadMessage(`${t.uploaded} ${asset.originalName}`);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    } catch (error) {
      setUploadMessage(describeApiError(error, t.uploadFailed));
    }
  }

  async function submitLesson() {
    setLessonMessage(null);

    if (!activeModuleId) {
      setLessonMessage(t.chooseModuleFirst);
      return;
    }

    const title = lessonForm.title.trim();
    const order = Number(lessonForm.order || "0");

    if (title.length < 2 || Number.isNaN(order) || order < 1) {
      setLessonMessage(t.lessonFailed);
      return;
    }

    if (lessonForm.type === "VIDEO" && !lessonForm.mediaAssetId.trim() && !lessonForm.contentUrl.trim()) {
      setLessonMessage(t.videoNeedsAsset);
      return;
    }

    if (lessonForm.type === "TEXT" && !lessonForm.content.trim()) {
      setLessonMessage(t.textNeedsContent);
      return;
    }

    try {
      const created = await addLesson.mutateAsync({
        moduleId: activeModuleId,
        title,
        type: lessonForm.type,
        order,
        contentUrl: lessonForm.contentUrl.trim() || undefined,
        content: lessonForm.content.trim() || undefined,
        mediaAssetId: lessonForm.mediaAssetId.trim() || undefined,
      });
      setLessonMessage(`${t.lessonCreated} ${created.title}`);
      setLessonForm((prev) => ({ ...prev, title: "", content: "" }));
    } catch (error) {
      setLessonMessage(describeApiError(error, t.lessonFailed));
    }
  }

  async function submitPublish() {
    setPublishMessage(null);
    if (!activeCourseId) {
      setPublishMessage(t.chooseCourseFirst);
      return;
    }

    try {
      const result = await publishCourse.mutateAsync(activeCourseId);
      setPublishMessage(`${t.publishDone} ${result.status}`);
    } catch (error) {
      setPublishMessage(describeApiError(error, t.publishFailed));
    }
  }

  if (meLoading) {
    return (
      <AppShell title={t.guardTitle} subtitle={t.guardSubtitle}>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--muted)]">{t.checkingAccess}</p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (me?.role !== "INSTRUCTOR") {
    return (
      <AppShell title={t.guardTitle} subtitle={t.guardSubtitle}>
        <Card>
          <CardHeader>
            <CardTitle>{t.guardTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted)]">
              {t.signedInAs} {me?.role ?? "UNKNOWN"}
            </p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title={t.pageTitle} subtitle={t.pageSubtitle}>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <p className="text-sm text-[var(--muted)]">{t.currentCourse}</p>
          <p className="mt-2 text-sm font-semibold">{selectedCourse?.title ?? t.notSelected}</p>
        </article>
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <p className="text-sm text-[var(--muted)]">{t.currentModule}</p>
          <p className="mt-2 text-sm font-semibold">{selectedModule?.title ?? t.notSelected}</p>
        </article>
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <p className="text-sm text-[var(--muted)]">{t.latestAsset}</p>
          <p className="mt-2 truncate text-sm font-semibold">{uploadedAsset?.originalName ?? t.noUpload}</p>
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.step1Title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-[var(--muted)]">{t.chooseCourse}</label>
              <select
                value={activeCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedModuleId("");
                }}
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 text-sm"
              >
                <option value="">{t.noCourses}</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-[var(--line)] p-3">
              <p className="text-sm font-medium">{t.createCourseTitle}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                      slug: prev.slug || slugify(e.target.value),
                    }))
                  }
                  placeholder={t.title}
                />
                <Input
                  value={courseForm.slug}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder={t.slug}
                />
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t.description}
                  className="md:col-span-2 min-h-[100px] rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm"
                />
                <Input
                  value={courseForm.category}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder={t.category}
                />
                <Input
                  value={courseForm.level}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, level: e.target.value }))}
                  placeholder={t.level}
                />
                <Input
                  value={courseForm.language}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, language: e.target.value }))}
                  placeholder={t.language}
                />
                <Input
                  type="number"
                  value={courseForm.priceCents}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, priceCents: e.target.value }))}
                  placeholder={t.priceCents}
                />
              </div>
              {courseMessage ? <p className="mt-3 text-sm">{courseMessage}</p> : null}
              <button
                type="button"
                onClick={submitCourse}
                disabled={createCourse.isPending}
                className="mt-3 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {createCourse.isPending ? t.creatingCourse : t.createCourseButton}
              </button>
            </div>

            <div className="rounded-xl border border-[var(--line)] p-3">
              <p className="text-sm font-medium">{t.publishTitle}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{t.publishHint}</p>
              {publishMessage ? <p className="mt-2 text-sm">{publishMessage}</p> : null}
              <button
                type="button"
                onClick={submitPublish}
                disabled={publishCourse.isPending || !activeCourseId}
                className="mt-3 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {publishCourse.isPending ? t.publishing : t.publishButton}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.step2Title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={moduleForm.title}
              onChange={(e) => setModuleForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={t.moduleTitle}
            />
            <Input
              type="number"
              value={moduleForm.order}
              onChange={(e) => setModuleForm((prev) => ({ ...prev, order: e.target.value }))}
              placeholder={t.order}
            />
            {moduleMessage ? <p className="text-sm">{moduleMessage}</p> : null}
            <button
              type="button"
              onClick={submitModule}
              disabled={addModule.isPending || !activeCourseId}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {addModule.isPending ? t.addingModule : t.addModuleButton}
            </button>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.step3Title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[var(--muted)]">{t.uploadHint}</p>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="block w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm"
            />
            {uploadMessage ? <p className="text-sm">{uploadMessage}</p> : null}
            <button
              type="button"
              onClick={submitVideo}
              disabled={uploadVideo.isPending}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {uploadVideo.isPending ? t.uploadingVideo : t.uploadVideoButton}
            </button>
            {uploadedAsset ? (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3 text-sm">
                <p className="font-medium">{uploadedAsset.originalName}</p>
                <p className="text-xs text-[var(--muted)]">
                  {uploadedAsset.id} - {formatBytes(uploadedAsset.sizeBytes)}
                </p>
                <a
                  href={uploadedAsset.streamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  {t.openStreamUrl}
                </a>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.step4Title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={activeModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 text-sm"
            >
              {modules.length === 0 ? <option value="">{t.noModules}</option> : null}
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  #{module.order} - {module.title}
                </option>
              ))}
            </select>
            <Input
              value={lessonForm.title}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={t.lessonTitle}
            />
            <select
              value={lessonForm.type}
              onChange={(e) =>
                setLessonForm((prev) => ({
                  ...prev,
                  type: e.target.value as "VIDEO" | "TEXT" | "QUIZ",
                }))
              }
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 text-sm"
            >
              <option value="VIDEO">{t.videoOption}</option>
              <option value="TEXT">{t.textOption}</option>
              <option value="QUIZ">{t.quizOption}</option>
            </select>
            <Input
              type="number"
              value={lessonForm.order}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, order: e.target.value }))}
              placeholder={t.order}
            />
            <Input
              value={lessonForm.mediaAssetId}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, mediaAssetId: e.target.value }))}
              placeholder={t.mediaAssetId}
            />
            <Input
              value={lessonForm.contentUrl}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, contentUrl: e.target.value }))}
              placeholder={t.contentUrl}
            />
            <textarea
              value={lessonForm.content}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, content: e.target.value }))}
              placeholder={t.textContent}
              className="min-h-[120px] w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm"
            />
            {lessonMessage ? <p className="text-sm">{lessonMessage}</p> : null}
            <button
              type="button"
              onClick={submitLesson}
              disabled={addLesson.isPending || !activeModuleId}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {addLesson.isPending ? t.addingLesson : t.addLessonButton}
            </button>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

export default function InstructorPage() {
  return (
    <AuthGuard>
      <InstructorContent />
    </AuthGuard>
  );
}
