"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PublicHeader } from "@/components/layout/public-header";
import { useLanguage } from "@/components/providers/language-provider";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/http";
import { useRegister } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/lib/store/auth-store";

type FormValues = {
  firstName: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const registerMutation = useRegister();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const t = {
    en: {
      minName: "At least 2 characters",
      validEmail: "Enter a valid email",
      minPassword: "At least 8 characters",
      startToday: "Start today",
      title: "Create your account",
      subtitle: "Join the learning platform with role-based dashboards, course progress, and achievements.",
      item1: "Structured learning tracks",
      item2: "XP, level, and streak gamification",
      item3: "Friend network and live chat",
      register: "Register",
      firstName: "First name",
      email: "Email",
      password: "Password",
      pending: "Creating...",
      create: "Create account",
      done: "Account created. Redirecting...",
      failed: "Registration failed. Please try again.",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
    },
    ru: {
      minName: "Не менее 2 символов",
      validEmail: "Введите корректный email",
      minPassword: "Не менее 8 символов",
      startToday: "Начните сегодня",
      title: "Создайте аккаунт",
      subtitle: "Присоединяйтесь к платформе обучения с ролевыми кабинетами, прогрессом курсов и достижениями.",
      item1: "Структурированные учебные треки",
      item2: "Геймификация: XP, уровни и streak",
      item3: "Сеть друзей и живой чат",
      register: "Регистрация",
      firstName: "Имя",
      email: "Email",
      password: "Пароль",
      pending: "Создаём...",
      create: "Создать аккаунт",
      done: "Аккаунт создан. Перенаправляем...",
      failed: "Регистрация не удалась. Попробуйте еще раз.",
      haveAccount: "Уже есть аккаунт?",
      signIn: "Войти",
    },
    kz: {
      minName: "Кемінде 2 таңба",
      validEmail: "Дұрыс email енгізіңіз",
      minPassword: "Кемінде 8 таңба",
      startToday: "Бүгін бастаңыз",
      title: "Аккаунт жасаңыз",
      subtitle: "Рөлдік кабинеттері, курстар прогресі және жетістіктері бар оқу платформасына қосылыңыз.",
      item1: "Құрылымдалған оқу бағыттары",
      item2: "Геймификация: XP, деңгейлер және streak",
      item3: "Достар желісі мен live чат",
      register: "Тіркелу",
      firstName: "Аты",
      email: "Email",
      password: "Құпиясөз",
      pending: "Құрылуда...",
      create: "Аккаунт ашу",
      done: "Аккаунт ашылды. Бағытталуда...",
      failed: "Тіркелу мүмкін болмады. Қайта көріңіз.",
      haveAccount: "Аккаунтыңыз бар ма?",
      signIn: "Кіру",
    },
  }[locale];

  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, t.minName),
        email: z.string().email(t.validEmail),
        password: z.string().min(8, t.minPassword),
      }),
    [t.minName, t.minPassword, t.validEmail],
  );

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setStatusMessage(null);
    try {
      const tokens = await registerMutation.mutateAsync({
        email: values.email,
        password: values.password,
        firstName: values.firstName.trim(),
      });
      useAuthStore.getState().setAccessToken(tokens.accessToken);
      const user = await api.users.me();
      setAuth({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      setStatusMessage(t.done);
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setStatusMessage(error.message);
        return;
      }
      setStatusMessage(t.failed);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      <PublicHeader active="register" />

      <section className="mt-5 grid w-full gap-5 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-4 md:grid-cols-2 md:p-8">
        <div className="rounded-2xl bg-[var(--soft)] p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.startToday}</p>
          <h1 className="mt-2 text-3xl font-semibold">{t.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{t.subtitle}</p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>- {t.item1}</p>
            <p>- {t.item2}</p>
            <p>- {t.item3}</p>
          </div>
        </div>

        <form className="space-y-4 rounded-2xl border border-[var(--line)] p-5" onSubmit={handleSubmit(onSubmit)}>
          <h2 className="text-xl font-semibold">{t.register}</h2>
          <input
            type="text"
            placeholder={t.firstName}
            {...register("firstName")}
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 text-sm"
          />
          {formState.errors.firstName ? (
            <p className="text-xs text-red-600">{formState.errors.firstName.message}</p>
          ) : null}

          <input
            type="email"
            placeholder={t.email}
            {...register("email")}
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 text-sm"
          />
          {formState.errors.email ? (
            <p className="text-xs text-red-600">{formState.errors.email.message}</p>
          ) : null}

          <input
            type="password"
            placeholder={t.password}
            {...register("password")}
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 text-sm"
          />
          {formState.errors.password ? (
            <p className="text-xs text-red-600">{formState.errors.password.message}</p>
          ) : null}

          {statusMessage ? (
            <p
              className={`text-xs ${registerMutation.isError ? "text-red-600" : "text-[var(--ok)]"}`}
            >
              {statusMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {registerMutation.isPending ? t.pending : t.create}
          </button>

          <p className="text-xs text-muted-foreground">
            {t.haveAccount}{" "}
            <Link href="/login" className="text-[var(--accent)] underline underline-offset-2">
              {t.signIn}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}


