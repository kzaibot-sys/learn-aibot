"use client";

import { useMemo, useState } from "react";
import { useLessonQuiz, useSubmitQuiz } from "@/lib/hooks/use-courses";
import { ApiClientError } from "@/lib/api/http";
import type { LessonDetails } from "@/lib/api/types";
import { Button } from "@/components/ui/button";

function formatQuizError(err: unknown): string {
  if (err instanceof ApiClientError) return err.message;
  if (err instanceof Error) return err.message;
  return "Произошла ошибка";
}

type Props = {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  progress: LessonDetails["progress"];
};

export function QuizLessonPanel({ courseId, lessonId, lessonTitle, progress }: Props) {
  const quizQuery = useLessonQuiz(lessonId, true);
  const submitQuiz = useSubmitQuiz(courseId);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const quiz = quizQuery.data?.quiz;
  const questions = useMemo(
    () => quizQuery.data?.quiz?.questions ?? [],
    [quizQuery.data],
  );
  const passing = quiz?.passingScorePercent ?? 0;

  const allAnswered = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((q) => Boolean(answers[q.id]?.trim()));
  }, [questions, answers]);

  const displayScore = submitQuiz.data?.score ?? progress?.quizScore ?? null;
  const displayCompleted =
    submitQuiz.isSuccess && submitQuiz.data
      ? submitQuiz.data.completed
      : Boolean(progress?.completed);

  const showResultBanner =
    (submitQuiz.isSuccess && submitQuiz.data) ||
    (progress?.quizScore != null && !submitQuiz.isPending);

  const handleSubmit = () => {
    if (!allAnswered) return;
    submitQuiz.mutate({ lessonId, answers });
  };

  if (quizQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка теста...</p>;
  }

  if (quizQuery.isError) {
    return (
      <p className="text-sm text-red-600">
        {formatQuizError(quizQuery.error)}
      </p>
    );
  }

  if (!quizQuery.data || questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Для этого урока пока нет вопросов.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{lessonTitle || quizQuery.data.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Проходной балл: {passing}%
        </p>
      </div>

      {showResultBanner && displayScore != null && (
        <div
          className={`rounded-xl border p-3 text-sm ${
            displayCompleted
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          <p className="font-medium">
            Результат: {displayScore}% —{" "}
            {displayCompleted ? "зачёт" : "ниже проходного балла"}
          </p>
          {!submitQuiz.isSuccess && progress?.quizScore != null && (
            <p className="mt-1 text-xs opacity-90">
              Сохранённый прогресс. Отправьте ответы снова, чтобы обновить результат.
            </p>
          )}
        </div>
      )}

      <ol className="space-y-4">
        {questions.map((question, idx) => (
          <li
            key={question.id}
            className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"
          >
            <p className="text-sm font-medium">
              {idx + 1}. {question.prompt}
            </p>
            <div className="mt-2 space-y-2">
              {question.options.map((opt) => {
                const name = `q-${question.id}`;
                const checked = answers[question.id] === opt.id;
                return (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer items-start gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      name={name}
                      value={opt.id}
                      checked={checked}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [question.id]: opt.id }))
                      }
                    />
                    <span>{opt.text}</span>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!allAnswered || submitQuiz.isPending}
        >
          {submitQuiz.isPending ? "Отправка..." : "Отправить ответы"}
        </Button>
        {!allAnswered && (
          <span className="text-xs text-muted-foreground">
            Ответьте на все вопросы
          </span>
        )}
      </div>

      {submitQuiz.isError && (
        <p className="text-xs text-red-600">{formatQuizError(submitQuiz.error)}</p>
      )}
      {submitQuiz.isSuccess && submitQuiz.data && (
        <p className="text-xs text-emerald-700">
          Прогресс курса: {Math.round(submitQuiz.data.courseProgress)}%
        </p>
      )}
    </div>
  );
}
