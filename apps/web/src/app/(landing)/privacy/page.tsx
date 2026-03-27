import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — AiBot',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          &larr; На главную
        </Link>

        <h1 className="text-3xl font-bold mb-8">Политика конфиденциальности</h1>

        <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground">
          <p>
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты
            персональных данных пользователей платформы AiBot (далее — «Платформа»),
            принадлежащей ТОО «AiBot». Используя Платформу, вы соглашаетесь с условиями
            данной Политики.
          </p>

          <h2 className="text-xl font-semibold text-foreground">1. Сбор информации</h2>
          <p>
            Мы собираем информацию, которую вы предоставляете при регистрации: имя,
            адрес электронной почты, данные аккаунта Telegram. Также автоматически
            собираются технические данные: IP-адрес, тип браузера, время посещения
            и действия на Платформе.
          </p>

          <h2 className="text-xl font-semibold text-foreground">2. Использование информации</h2>
          <p>
            Собранные данные используются для предоставления доступа к курсам,
            персонализации обучения, улучшения качества Платформы, отправки уведомлений
            о новых курсах и обновлениях, а также для обеспечения безопасности аккаунтов.
          </p>

          <h2 className="text-xl font-semibold text-foreground">3. Защита данных</h2>
          <p>
            Мы принимаем технические и организационные меры для защиты ваших персональных
            данных от несанкционированного доступа, изменения, раскрытия или уничтожения.
            Все данные передаются по защищённым каналам связи (SSL/TLS).
          </p>

          <h2 className="text-xl font-semibold text-foreground">4. Контакты</h2>
          <p>
            По вопросам, связанным с обработкой персональных данных, вы можете
            обратиться к нам через Telegram: @aibot_edu или по электронной почте,
            указанной на сайте.
          </p>
        </div>
      </div>
    </div>
  );
}
