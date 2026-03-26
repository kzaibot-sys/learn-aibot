const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // 1. Find admin user
  const admin = await prisma.user.findUnique({
    where: { email: "admin@learnhub.kz" },
  });

  if (!admin) {
    throw new Error("Admin user with email admin@learnhub.kz not found");
  }

  console.log("Found admin user:", admin.id);

  // 2. Create course
  const course = await prisma.course.upsert({
    where: { slug: "ai-machine-learning" },
    update: {},
    create: {
      title: "AI и машинное обучение",
      slug: "ai-machine-learning",
      description:
        "Полный курс по искусственному интеллекту и машинному обучению. Вы изучите основы нейронных сетей, алгоритмы классификации и регрессии, а также научитесь применять ML-модели на практике. Курс включает реальные проекты и задания для закрепления материала.",
      price: 4990,
      currency: "RUB",
      isPublished: true,
      isFree: false,
      coverUrl: null,
    },
  });

  console.log("Course created:", course.id);

  // 3. Create modules
  const modulesData = [
    {
      title: "Введение в AI",
      description: "Знакомство с основными концепциями искусственного интеллекта",
      order: 1,
    },
    {
      title: "Основы Machine Learning",
      description: "Алгоритмы и методы машинного обучения",
      order: 2,
    },
    {
      title: "Практика и проекты",
      description: "Применение знаний на реальных проектах",
      order: 3,
    },
  ];

  const modules = [];
  for (const m of modulesData) {
    const mod = await prisma.module.create({
      data: {
        courseId: course.id,
        title: m.title,
        description: m.description,
        order: m.order,
        isPublished: true,
      },
    });
    modules.push(mod);
    console.log(`Module created: ${mod.id} — ${mod.title}`);
  }

  // 4. Create lessons
  const videoUrl =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  const lessonsData = [
    // Module 1: Введение в AI (3 lessons)
    {
      moduleId: modules[0].id,
      title: "Что такое искусственный интеллект?",
      type: "VIDEO",
      videoUrl,
      duration: 15,
      order: 1,
      content:
        "<h2>Что такое AI?</h2><p>В этом уроке мы разберём основные определения и историю развития искусственного интеллекта. Узнаем, чем отличается сильный ИИ от слабого, и какие задачи решает AI сегодня.</p>",
    },
    {
      moduleId: modules[0].id,
      title: "История развития AI",
      type: "TEXT",
      videoUrl: null,
      duration: 10,
      order: 2,
      content:
        "<h2>История AI</h2><p>От первых экспертных систем до современных нейросетей. Мы рассмотрим ключевые вехи: тест Тьюринга, зимы AI, прорыв глубокого обучения в 2012 году, и появление трансформеров.</p><ul><li>1950 — Тест Тьюринга</li><li>1956 — Дартмутская конференция</li><li>2012 — AlexNet и революция глубокого обучения</li><li>2017 — Архитектура Transformer</li></ul>",
    },
    {
      moduleId: modules[0].id,
      title: "Области применения AI",
      type: "VIDEO",
      videoUrl,
      duration: 20,
      order: 3,
      content:
        "<h2>Где применяется AI?</h2><p>Компьютерное зрение, NLP, рекомендательные системы, автономные автомобили, медицинская диагностика и многое другое. Разбираем реальные кейсы из индустрии.</p>",
    },
    // Module 2: Основы Machine Learning (3 lessons)
    {
      moduleId: modules[1].id,
      title: "Линейная регрессия",
      type: "VIDEO",
      videoUrl,
      duration: 25,
      order: 1,
      content:
        "<h2>Линейная регрессия</h2><p>Первый алгоритм ML, который должен знать каждый. Разбираем математику, функцию потерь MSE, градиентный спуск. Пишем реализацию с нуля на Python.</p>",
    },
    {
      moduleId: modules[1].id,
      title: "Классификация и логистическая регрессия",
      type: "VIDEO",
      videoUrl,
      duration: 30,
      order: 2,
      content:
        "<h2>Классификация</h2><p>Переходим от регрессии к классификации. Сигмоидная функция, бинарная кросс-энтропия, метрики качества: accuracy, precision, recall, F1-score.</p>",
    },
    {
      moduleId: modules[1].id,
      title: "Деревья решений и ансамбли",
      type: "TEXT",
      videoUrl: null,
      duration: 20,
      order: 3,
      content:
        "<h2>Деревья решений</h2><p>Как работают деревья решений, критерии разбиения (Gini, Entropy). Ансамблевые методы: Random Forest, Gradient Boosting, XGBoost. Когда что применять.</p><p>Практическое задание: обучите модель XGBoost на датасете Titanic и добейтесь accuracy > 0.80.</p>",
    },
    // Module 3: Практика и проекты (2 lessons)
    {
      moduleId: modules[2].id,
      title: "Проект: предсказание цен на недвижимость",
      type: "VIDEO",
      videoUrl,
      duration: 30,
      order: 1,
      content:
        "<h2>Проект: цены на недвижимость</h2><p>Полный пайплайн ML-проекта: сбор данных, EDA, feature engineering, обучение модели, валидация, деплой. Используем реальный датасет с ценами на квартиры в Москве.</p>",
    },
    {
      moduleId: modules[2].id,
      title: "Проект: чат-бот с NLP",
      type: "VIDEO",
      videoUrl,
      duration: 25,
      order: 2,
      content:
        "<h2>Проект: NLP чат-бот</h2><p>Создаём чат-бота с использованием NLP: токенизация, эмбеддинги, intent classification. Интеграция с Telegram Bot API. Деплой на сервер.</p>",
    },
  ];

  const lessons = [];
  for (const l of lessonsData) {
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: l.moduleId,
        title: l.title,
        type: l.type,
        videoUrl: l.videoUrl,
        duration: l.duration,
        content: l.content,
        order: l.order,
        isPublished: true,
        isFree: l.order === 1 && l.moduleId === modules[0].id, // first lesson is free
      },
    });
    lessons.push(lesson);
    console.log(`Lesson created: ${lesson.id} — ${lesson.title}`);
  }

  // 5. Enroll admin user
  const enrollment = await prisma.enrollment.upsert({
    where: {
      userId_courseId: { userId: admin.id, courseId: course.id },
    },
    update: {},
    create: {
      userId: admin.id,
      courseId: course.id,
      status: "ACTIVE",
    },
  });

  console.log("Enrollment created:", enrollment.id);

  // 6. Mark first 3 lessons as completed
  for (let i = 0; i < 3; i++) {
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: admin.id, lessonId: lessons[i].id },
      },
      update: {},
      create: {
        userId: admin.id,
        lessonId: lessons[i].id,
        completed: true,
        watchedSec: lessons[i].duration * 60,
        completedAt: new Date(),
      },
    });
    console.log(`Progress created: ${progress.id} — lesson ${lessons[i].title}`);
  }

  console.log("\n--- SUMMARY ---");
  console.log("Course ID:", course.id);
  console.log("Module IDs:", modules.map((m) => m.id));
  console.log("Lesson IDs:", lessons.map((l) => l.id));
  console.log("Enrollment ID:", enrollment.id);
  console.log("Admin user ID:", admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
