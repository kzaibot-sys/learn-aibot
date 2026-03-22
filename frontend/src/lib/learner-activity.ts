import type { LearnerActivityItem } from "@/lib/api/types";

export function formatLearnerActivityLabel(item: LearnerActivityItem): string {
  switch (item.type) {
    case "ENROLLED":
      return `Запись на курс «${item.courseTitle}»`;
    case "LESSON_PROGRESS":
      return item.lessonTitle
        ? `Прогресс по уроку «${item.lessonTitle}» · ${item.courseTitle}`
        : `Прогресс по курсу «${item.courseTitle}»`;
    case "LESSON_COMPLETED":
      return item.lessonTitle
        ? `Урок завершён: «${item.lessonTitle}» · ${item.courseTitle}`
        : `Урок завершён в курсе «${item.courseTitle}»`;
    case "QUIZ_SUBMITTED": {
      const score =
        typeof item.meta.quizScore === "number" ? ` · ${item.meta.quizScore}%` : "";
      return item.lessonTitle
        ? `Тест отправлен: «${item.lessonTitle}»${score}`
        : `Тест отправлен в курсе «${item.courseTitle}»${score}`;
    }
    default:
      return `Событие · ${item.courseTitle}`;
  }
}

export function formatLearnerActivityTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}
