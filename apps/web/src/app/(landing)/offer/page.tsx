import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Публичная оферта — AiBot',
};

export default function OfferPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          &larr; На главную
        </Link>

        <h1 className="text-3xl font-bold mb-8">Публичная оферта</h1>

        <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground">
          <p>
            Настоящий документ является официальным предложением (публичной офертой)
            ТОО «AiBot» заключить договор на оказание образовательных услуг посредством
            платформы AiBot на изложенных ниже условиях.
          </p>

          <h2 className="text-xl font-semibold text-foreground">1. Предмет оферты</h2>
          <p>
            Исполнитель обязуется предоставить Заказчику доступ к образовательным
            материалам (онлайн-курсам) на Платформе, а Заказчик обязуется принять
            и оплатить услуги в порядке, определённом настоящей офертой. Акцептом
            оферты является регистрация на Платформе и получение доступа к курсу.
          </p>

          <h2 className="text-xl font-semibold text-foreground">2. Порядок оказания услуг</h2>
          <p>
            Доступ к курсу предоставляется после подтверждения администратором.
            Срок доступа к материалам курса не ограничен, если иное не указано
            в описании конкретного курса. Исполнитель вправе обновлять и дополнять
            учебные материалы.
          </p>

          <h2 className="text-xl font-semibold text-foreground">3. Стоимость и порядок оплаты</h2>
          <p>
            Стоимость услуг указывается на странице курса. Оплата производится
            в порядке, предусмотренном на Платформе. Исполнитель вправе изменять
            стоимость услуг, при этом для оплаченных курсов условия сохраняются.
          </p>

          <h2 className="text-xl font-semibold text-foreground">4. Реквизиты</h2>
          <p>
            ТОО «AiBot», Республика Казахстан. Контактная информация доступна
            на главной странице сайта и в Telegram: @aibot_edu.
          </p>
        </div>
      </div>
    </div>
  );
}
