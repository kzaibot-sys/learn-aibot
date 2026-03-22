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
import { useLogin } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/lib/store/auth-store";

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const login = useLogin();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const t = {
    en: {
      validEmail: "Enter a valid email",
      minPassword: "At least 8 characters",
      welcome: "Welcome back",
      title: "Sign in to Learn.Aibot",
      subtitle: "Access your dashboard, continue your courses, and keep your streak going.",
      item1: "Continue from your last lesson",
      item2: "Track XP, level, and achievements",
      item3: "Learn together with friends and chat",
      signIn: "Sign in",
      email: "Email",
      password: "Password",
      pending: "Signing in...",
      done: "Signed in. Redirecting...",
      failed: "Could not sign in. Please try again.",
      newHere: "New here?",
      register: "Create an account",
    },
    ru: {
      validEmail: "Введите корректный email",
      minPassword: "Не менее 8 символов",
      welcome: "С возвращением",
      title: "Войдите в Learn.Aibot",
      subtitle: "Откройте свой дашборд, продолжайте курсы и сохраняйте прогресс.",
      item1: "Продолжайте с последнего урока",
      item2: "Отслеживайте XP, уровень и достижения",
      item3: "Учитесь вместе с друзьями и общайтесь в чате",
      signIn: "Войти",
      email: "Email",
      password: "Пароль",
      pending: "Входим...",
      done: "Вход выполнен. Перенаправляем...",
      failed: "Не удалось войти. Попробуйте еще раз.",
      newHere: "Впервые здесь?",
      register: "Создать аккаунт",
    },
    kz: {
      validEmail: "Дұрыс email енгізіңіз",
      minPassword: "Кемінде 8 таңба",
      welcome: "Қош келдіңіз",
      title: "Learn.Aibot жүйесіне кіріңіз",
      subtitle: "Жеке кабинетке өтіп, курстарды жалғастырыңыз және прогресті сақтаңыз.",
      item1: "Соңғы сабақтан жалғастырыңыз",
      item2: "XP, деңгей және жетістіктерді бақылаңыз",
      item3: "Достармен бірге оқып, чатта сөйлесіңіз",
      signIn: "Кіру",
      email: "Email",
      password: "Құпиясөз",
      pending: "Кіруде...",
      done: "Кіру орындалды. Бағытталуда...",
      failed: "Кіру мүмкін болмады. Қайта көріңіз.",
      newHere: "Жаңа пайдаланушысыз ба?",
      register: "Аккаунт ашу",
    },
  }[locale];

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t.validEmail),
        password: z.string().min(8, t.minPassword),
      }),
    [t.minPassword, t.validEmail],
  );

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setStatusMessage(null);
    try {
      const tokens = await login.mutateAsync(values);
      useAuthStore.getState().setAccessToken(tokens.accessToken);
      const user = await api.users.me();
      setAuth({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      setStatusMessage(t.done);
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next || "/dashboard");
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
      <PublicHeader active="login" />

      <section className="mt-5 grid w-full gap-5 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-4 md:grid-cols-2 md:p-8">
        <div className="rounded-2xl bg-[var(--soft)] p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.welcome}</p>
          <h1 className="mt-2 text-3xl font-semibold">{t.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{t.subtitle}</p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>- {t.item1}</p>
            <p>- {t.item2}</p>
            <p>- {t.item3}</p>
          </div>
        </div>

        <form className="space-y-4 rounded-2xl border border-[var(--line)] p-5" onSubmit={handleSubmit(onSubmit)}>
          <h2 className="text-xl font-semibold">{t.signIn}</h2>
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
            <p className={`text-xs ${login.isError ? "text-red-600" : "text-[var(--ok)]"}`}>
              {statusMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {login.isPending ? t.pending : t.signIn}
          </button>

          <p className="text-xs text-muted-foreground">
            {t.newHere}{" "}
            <Link href="/register" className="text-[var(--accent)] underline underline-offset-2">
              {t.register}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}


