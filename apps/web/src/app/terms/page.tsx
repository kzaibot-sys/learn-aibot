import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Условия использования — AiBot',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          &larr; На главную
        </Link>

        <h1 className="text-3xl font-bold mb-8">Условия использования</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p>
            Настоящие Условия использования (далее — «Условия») регулируют порядок
            доступа и использования образовательной платформы AiBot, принадлежащей
            ТОО «AiBot». Регистрируясь на Платформе, вы принимаете данные Условия
            в полном объёме.
          </p>

          <h2 className="text-xl font-semibold text-foreground">1. Общие положения</h2>
          <p>
            Платформа предоставляет доступ к онлайн-курсам, видеоурокам, практическим
            заданиям и AI-помощнику. Доступ к курсам предоставляется после подтверждения
            администратором. Все материалы Платформы защищены авторским правом.
          </p>

          <h2 className="text-xl font-semibold text-foreground">2. Права и обязанности пользователя</h2>
          <p>
            Пользователь обязуется не распространять учебные материалы третьим лицам,
            не использовать Платформу в противоправных целях, предоставлять достоверную
            информацию при регистрации. Пользователь имеет право на получение сертификата
            при успешном завершении курса.
          </p>

          <h2 className="text-xl font-semibold text-foreground">3. Ограничение ответственности</h2>
          <p>
            Платформа предоставляется «как есть». ТОО «AiBot» не гарантирует
            бесперебойную работу сервиса и не несёт ответственности за убытки,
            возникшие в результате использования или невозможности использования
            Платформы.
          </p>

          <h2 className="text-xl font-semibold text-foreground">4. Изменение условий</h2>
          <p>
            ТОО «AiBot» оставляет за собой право изменять настоящие Условия.
            Актуальная версия всегда доступна на данной странице. Продолжая
            использовать Платформу после внесения изменений, вы соглашаетесь
            с обновлёнными Условиями.
          </p>
        </div>
      </div>
    </div>
  );
}
