const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

function randDuration() {
  return Math.floor(Math.random() * 26) + 10; // 10-35
}

async function main() {
  // 1. Find admin user
  const admin = await prisma.user.findUnique({
    where: { email: "admin@learnhub.kz" },
  });
  if (!admin) throw new Error("Admin user with email admin@learnhub.kz not found");
  console.log("Found admin user:", admin.id);

  // ===== COURSE 1: React Advanced Patterns =====
  const course1 = await prisma.course.upsert({
    where: { slug: "react-advanced-patterns" },
    update: { price: 39900, isPublished: true },
    create: {
      title: "React Advanced Patterns",
      slug: "react-advanced-patterns",
      description:
        "Продвинутые паттерны React: Compound Components, Render Props, HOC, Custom Hooks, State Machines, Concurrent Features и оптимизация производительности.",
      price: 39900,
      currency: "RUB",
      isPublished: true,
    },
  });
  console.log("Course 1 created:", course1.id, course1.title);

  // Delete old modules/lessons for idempotency
  await prisma.module.deleteMany({ where: { courseId: course1.id } });

  const c1Modules = [];
  const c1ModulesData = [
    { title: "Паттерны композиции", description: "Compound Components, Render Props, HOC", order: 1 },
    { title: "Управление состоянием", description: "Custom Hooks, State Machines, Context", order: 2 },
  ];
  for (const m of c1ModulesData) {
    const mod = await prisma.module.create({
      data: { courseId: course1.id, ...m, isPublished: true },
    });
    c1Modules.push(mod);
  }

  const c1LessonsData = [
    // Module 1
    { moduleId: c1Modules[0].id, title: "Compound Components", order: 1, content: "<h2>Compound Components</h2><p>Изучаем паттерн Compound Components для создания гибких и переиспользуемых компонентов. Разбираем React.Children API и Context-подход.</p>" },
    { moduleId: c1Modules[0].id, title: "Render Props и HOC", order: 2, content: "<h2>Render Props и HOC</h2><p>Классические паттерны переиспользования логики. Когда применять Render Props, а когда Higher-Order Components.</p>" },
    { moduleId: c1Modules[0].id, title: "Паттерн Provider", order: 3, content: "<h2>Provider Pattern</h2><p>Создаём собственные Provider-компоненты для управления глобальным состоянием без Redux.</p>" },
    { moduleId: c1Modules[0].id, title: "Slots и Layout Components", order: 4, content: "<h2>Slots и Layout</h2><p>Паттерн Slots для гибких layout-компонентов. Инверсия контроля в React.</p>" },
    // Module 2
    { moduleId: c1Modules[1].id, title: "Custom Hooks: продвинутые техники", order: 1, content: "<h2>Custom Hooks</h2><p>Создаём переиспользуемые хуки: useAsync, useDebounce, useIntersectionObserver. Тестирование хуков.</p>" },
    { moduleId: c1Modules[1].id, title: "State Machines с XState", order: 2, content: "<h2>State Machines</h2><p>Управление сложным состоянием через конечные автоматы. Интеграция XState с React.</p>" },
    { moduleId: c1Modules[1].id, title: "React Concurrent Features", order: 3, content: "<h2>Concurrent Features</h2><p>useTransition, useDeferredValue, Suspense для данных. Оптимизация UX при тяжёлых вычислениях.</p>" },
    { moduleId: c1Modules[1].id, title: "Оптимизация производительности", order: 4, content: "<h2>Производительность</h2><p>React.memo, useMemo, useCallback, React Profiler. Виртуализация списков и code splitting.</p>" },
  ];

  const c1Lessons = [];
  for (const l of c1LessonsData) {
    const lesson = await prisma.lesson.create({
      data: { ...l, type: "VIDEO", videoUrl: VIDEO_URL, duration: randDuration(), isPublished: true },
    });
    c1Lessons.push(lesson);
  }
  console.log(`  Created ${c1Lessons.length} lessons`);

  // Enroll admin, mark 5/8 completed
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: admin.id, courseId: course1.id } },
    update: { status: "ACTIVE" },
    create: { userId: admin.id, courseId: course1.id, status: "ACTIVE" },
  });
  for (let i = 0; i < 5; i++) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: admin.id, lessonId: c1Lessons[i].id } },
      update: { completed: true, completedAt: new Date() },
      create: {
        userId: admin.id, lessonId: c1Lessons[i].id,
        completed: true, watchedSec: c1Lessons[i].duration * 60, completedAt: new Date(),
      },
    });
  }
  console.log("  Enrolled admin, 5/8 completed");

  // ===== COURSE 2: UI/UX Design Fundamentals =====
  const course2 = await prisma.course.upsert({
    where: { slug: "uiux-design" },
    update: { price: 29900, isPublished: true },
    create: {
      title: "UI/UX Design Fundamentals",
      slug: "uiux-design",
      description:
        "Основы UI/UX дизайна: исследование пользователей, прототипирование, визуальный дизайн, Figma, дизайн-системы и юзабилити-тестирование.",
      price: 29900,
      currency: "RUB",
      isPublished: true,
    },
  });
  console.log("Course 2 created:", course2.id, course2.title);

  await prisma.module.deleteMany({ where: { courseId: course2.id } });

  const c2Modules = [];
  const c2ModulesData = [
    { title: "UX Research и прототипирование", description: "Исследование пользователей, wireframes, прототипы", order: 1 },
    { title: "Визуальный дизайн и Figma", description: "Типографика, цвет, композиция, работа в Figma", order: 2 },
  ];
  for (const m of c2ModulesData) {
    const mod = await prisma.module.create({
      data: { courseId: course2.id, ...m, isPublished: true },
    });
    c2Modules.push(mod);
  }

  const c2LessonsData = [
    // Module 1 (3 lessons)
    { moduleId: c2Modules[0].id, title: "Основы UX Research", order: 1, content: "<h2>UX Research</h2><p>Методы исследования пользователей: интервью, опросы, наблюдение. Создание персон и карт пути пользователя (CJM).</p>" },
    { moduleId: c2Modules[0].id, title: "Информационная архитектура", order: 2, content: "<h2>Информационная архитектура</h2><p>Организация контента, навигация, карточная сортировка. Принципы IA для веб и мобильных приложений.</p>" },
    { moduleId: c2Modules[0].id, title: "Wireframes и прототипирование", order: 3, content: "<h2>Прототипирование</h2><p>От скетчей к интерактивным прототипам. Low-fidelity и high-fidelity подходы. Инструменты: Figma, Sketch, Adobe XD.</p>" },
    // Module 2 (4 lessons)
    { moduleId: c2Modules[1].id, title: "Типографика и цвет", order: 1, content: "<h2>Типографика и цвет</h2><p>Выбор шрифтов, типографическая иерархия. Теория цвета, создание палитр, доступность (a11y).</p>" },
    { moduleId: c2Modules[1].id, title: "Работа в Figma", order: 2, content: "<h2>Figma</h2><p>Auto Layout, Components, Variants, Design Tokens. Совместная работа и передача макетов разработчикам.</p>" },
    { moduleId: c2Modules[1].id, title: "Дизайн-системы", order: 3, content: "<h2>Дизайн-системы</h2><p>Создание дизайн-системы с нуля: атомарный дизайн, компоненты, документация. Примеры: Material Design, Apple HIG.</p>" },
    { moduleId: c2Modules[1].id, title: "Юзабилити-тестирование", order: 4, content: "<h2>Юзабилити-тестирование</h2><p>Планирование и проведение тестов, анализ результатов. A/B тестирование, тепловые карты, метрики UX.</p>" },
  ];

  const c2Lessons = [];
  for (const l of c2LessonsData) {
    const lesson = await prisma.lesson.create({
      data: { ...l, type: "VIDEO", videoUrl: VIDEO_URL, duration: randDuration(), isPublished: true },
    });
    c2Lessons.push(lesson);
  }
  console.log(`  Created ${c2Lessons.length} lessons`);

  // Enroll admin, mark 3/7 completed
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: admin.id, courseId: course2.id } },
    update: { status: "ACTIVE" },
    create: { userId: admin.id, courseId: course2.id, status: "ACTIVE" },
  });
  for (let i = 0; i < 3; i++) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: admin.id, lessonId: c2Lessons[i].id } },
      update: { completed: true, completedAt: new Date() },
      create: {
        userId: admin.id, lessonId: c2Lessons[i].id,
        completed: true, watchedSec: c2Lessons[i].duration * 60, completedAt: new Date(),
      },
    });
  }
  console.log("  Enrolled admin, 3/7 completed");

  // ===== COURSE 3: TypeScript Deep Dive =====
  const course3 = await prisma.course.upsert({
    where: { slug: "typescript-deep-dive" },
    update: { price: 34900, isPublished: true },
    create: {
      title: "TypeScript Deep Dive",
      slug: "typescript-deep-dive",
      description:
        "Глубокое погружение в TypeScript: система типов, дженерики, условные типы, mapped types, декораторы и паттерны для крупных проектов.",
      price: 34900,
      currency: "RUB",
      isPublished: true,
    },
  });
  console.log("Course 3 created:", course3.id, course3.title);

  await prisma.module.deleteMany({ where: { courseId: course3.id } });

  const c3Modules = [];
  const c3ModulesData = [
    { title: "Продвинутая система типов", description: "Generics, Conditional Types, Template Literals", order: 1 },
    { title: "TypeScript на практике", description: "Паттерны, декораторы, интеграция с фреймворками", order: 2 },
  ];
  for (const m of c3ModulesData) {
    const mod = await prisma.module.create({
      data: { courseId: course3.id, ...m, isPublished: true },
    });
    c3Modules.push(mod);
  }

  const c3LessonsData = [
    // Module 1
    { moduleId: c3Modules[0].id, title: "Generics: от основ к мастерству", order: 1, content: "<h2>Generics</h2><p>Обобщённые типы, ограничения (constraints), вывод типов (inference). Создание типобезопасных утилит.</p>" },
    { moduleId: c3Modules[0].id, title: "Conditional Types и infer", order: 2, content: "<h2>Conditional Types</h2><p>Условные типы, ключевое слово infer, распределённые условные типы. Утилитарные типы стандартной библиотеки.</p>" },
    { moduleId: c3Modules[0].id, title: "Mapped Types и Template Literals", order: 3, content: "<h2>Mapped Types</h2><p>Трансформация типов через mapped types. Template Literal Types для строковых манипуляций на уровне типов.</p>" },
    { moduleId: c3Modules[0].id, title: "Type Guards и Narrowing", order: 4, content: "<h2>Type Guards</h2><p>Пользовательские type guards, discriminated unions, exhaustive checking. Безопасная работа с unknown.</p>" },
    // Module 2
    { moduleId: c3Modules[1].id, title: "Декораторы и метаданные", order: 1, content: "<h2>Декораторы</h2><p>Stage 3 декораторы, reflect-metadata. Паттерны: DI-контейнер, валидация, логирование.</p>" },
    { moduleId: c3Modules[1].id, title: "TypeScript + React", order: 2, content: "<h2>TS + React</h2><p>Типизация props, hooks, context, событий. Generics в компонентах. Паттерны для форм и таблиц.</p>" },
    { moduleId: c3Modules[1].id, title: "TypeScript + Node.js/Express", order: 3, content: "<h2>TS + Node.js</h2><p>Настройка проекта, типизация middleware, request/response. Интеграция с Prisma и Zod.</p>" },
    { moduleId: c3Modules[1].id, title: "Монорепо и конфигурация", order: 4, content: "<h2>Монорепо</h2><p>Project references, path aliases, composite builds. Настройка tsconfig для крупных проектов. Turborepo + TypeScript.</p>" },
  ];

  const c3Lessons = [];
  for (const l of c3LessonsData) {
    const lesson = await prisma.lesson.create({
      data: { ...l, type: "VIDEO", videoUrl: VIDEO_URL, duration: randDuration(), isPublished: true },
    });
    c3Lessons.push(lesson);
  }
  console.log(`  Created ${c3Lessons.length} lessons`);

  // Enroll admin, mark 7/8 completed
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: admin.id, courseId: course3.id } },
    update: { status: "ACTIVE" },
    create: { userId: admin.id, courseId: course3.id, status: "ACTIVE" },
  });
  for (let i = 0; i < 7; i++) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: admin.id, lessonId: c3Lessons[i].id } },
      update: { completed: true, completedAt: new Date() },
      create: {
        userId: admin.id, lessonId: c3Lessons[i].id,
        completed: true, watchedSec: c3Lessons[i].duration * 60, completedAt: new Date(),
      },
    });
  }
  console.log("  Enrolled admin, 7/8 completed");

  // ===== COURSE 4: Modern Web Development (no enrollment) =====
  const course4 = await prisma.course.upsert({
    where: { slug: "modern-web-dev" },
    update: { price: 49900, isPublished: true },
    create: {
      title: "Modern Web Development",
      slug: "modern-web-dev",
      description:
        "Полный курс по современной веб-разработке: HTML5, CSS3, JavaScript ES2024, React, Next.js, Node.js, базы данных и деплой.",
      price: 49900,
      currency: "RUB",
      isPublished: true,
    },
  });
  console.log("Course 4 created:", course4.id, course4.title);

  await prisma.module.deleteMany({ where: { courseId: course4.id } });

  const c4Modules = [];
  const c4ModulesData = [
    { title: "Frontend основы", description: "HTML5, CSS3, JavaScript", order: 1 },
    { title: "React и Next.js", description: "Современный фронтенд-фреймворк", order: 2 },
    { title: "Backend и деплой", description: "Node.js, базы данных, CI/CD", order: 3 },
  ];
  for (const m of c4ModulesData) {
    const mod = await prisma.module.create({
      data: { courseId: course4.id, ...m, isPublished: true },
    });
    c4Modules.push(mod);
  }

  const c4LessonsData = [
    // Module 1 (3 lessons)
    { moduleId: c4Modules[0].id, title: "Семантический HTML5", order: 1, content: "<h2>HTML5</h2><p>Семантические теги, формы, доступность. Лучшие практики разметки для SEO и a11y.</p>" },
    { moduleId: c4Modules[0].id, title: "CSS3 и современные layouts", order: 2, content: "<h2>CSS3</h2><p>Flexbox, Grid, Container Queries, CSS Layers. Адаптивный дизайн и CSS-анимации.</p>" },
    { moduleId: c4Modules[0].id, title: "JavaScript ES2024", order: 3, content: "<h2>JavaScript</h2><p>Async/await, модули, деструктуризация, optional chaining, новые API. Работа с DOM.</p>" },
    // Module 2 (3 lessons)
    { moduleId: c4Modules[1].id, title: "React: от нуля до продакшена", order: 1, content: "<h2>React</h2><p>Компоненты, хуки, роутинг, управление состоянием. React 19 и Server Components.</p>" },
    { moduleId: c4Modules[1].id, title: "Next.js App Router", order: 2, content: "<h2>Next.js</h2><p>App Router, Server Actions, ISR, Middleware. Оптимизация изображений и шрифтов.</p>" },
    { moduleId: c4Modules[1].id, title: "Стилизация и UI-библиотеки", order: 3, content: "<h2>Стилизация</h2><p>Tailwind CSS, Shadcn/UI, Radix Primitives. Создание переиспользуемых компонентов.</p>" },
    // Module 3 (3 lessons)
    { moduleId: c4Modules[2].id, title: "Node.js и Express", order: 1, content: "<h2>Node.js</h2><p>REST API, middleware, аутентификация JWT, валидация. Архитектура серверных приложений.</p>" },
    { moduleId: c4Modules[2].id, title: "PostgreSQL и Prisma", order: 2, content: "<h2>Базы данных</h2><p>Реляционные базы данных, SQL, Prisma ORM. Миграции, связи, оптимизация запросов.</p>" },
    { moduleId: c4Modules[2].id, title: "CI/CD и деплой", order: 3, content: "<h2>Деплой</h2><p>Docker, GitHub Actions, Vercel, Railway. Мониторинг, логирование и масштабирование.</p>" },
  ];

  const c4Lessons = [];
  for (const l of c4LessonsData) {
    const lesson = await prisma.lesson.create({
      data: { ...l, type: "VIDEO", videoUrl: VIDEO_URL, duration: randDuration(), isPublished: true },
    });
    c4Lessons.push(lesson);
  }
  console.log(`  Created ${c4Lessons.length} lessons (no enrollment)`);

  // ===== COURSE 5: Data Science с Python (no enrollment) =====
  const course5 = await prisma.course.upsert({
    where: { slug: "data-science-python" },
    update: { price: 44900, isPublished: true },
    create: {
      title: "Data Science с Python",
      slug: "data-science-python",
      description:
        "Курс по Data Science на Python: pandas, NumPy, matplotlib, scikit-learn, работа с данными, визуализация и построение ML-моделей.",
      price: 44900,
      currency: "RUB",
      isPublished: true,
    },
  });
  console.log("Course 5 created:", course5.id, course5.title);

  await prisma.module.deleteMany({ where: { courseId: course5.id } });

  const c5Modules = [];
  const c5ModulesData = [
    { title: "Python для анализа данных", description: "pandas, NumPy, matplotlib", order: 1 },
    { title: "Machine Learning с scikit-learn", description: "Классические алгоритмы ML", order: 2 },
  ];
  for (const m of c5ModulesData) {
    const mod = await prisma.module.create({
      data: { courseId: course5.id, ...m, isPublished: true },
    });
    c5Modules.push(mod);
  }

  const c5LessonsData = [
    // Module 1
    { moduleId: c5Modules[0].id, title: "NumPy: работа с массивами", order: 1, content: "<h2>NumPy</h2><p>Многомерные массивы, векторизация, broadcasting. Линейная алгебра с NumPy.</p>" },
    { moduleId: c5Modules[0].id, title: "pandas: анализ данных", order: 2, content: "<h2>pandas</h2><p>DataFrame, Series, фильтрация, группировка, объединение. Работа с пропущенными данными.</p>" },
    { moduleId: c5Modules[0].id, title: "Визуализация: matplotlib и seaborn", order: 3, content: "<h2>Визуализация</h2><p>Графики, гистограммы, scatter plots, heatmaps. Настройка стилей и интерактивные графики с Plotly.</p>" },
    { moduleId: c5Modules[0].id, title: "Exploratory Data Analysis", order: 4, content: "<h2>EDA</h2><p>Полный pipeline EDA: статистики, распределения, корреляции, выбросы. Практика на реальных датасетах.</p>" },
    // Module 2
    { moduleId: c5Modules[1].id, title: "Предобработка данных", order: 1, content: "<h2>Предобработка</h2><p>Feature engineering, кодирование категорий, масштабирование, Pipeline в scikit-learn.</p>" },
    { moduleId: c5Modules[1].id, title: "Классификация", order: 2, content: "<h2>Классификация</h2><p>Logistic Regression, SVM, Random Forest, XGBoost. Метрики: ROC-AUC, precision-recall.</p>" },
    { moduleId: c5Modules[1].id, title: "Регрессия и кластеризация", order: 3, content: "<h2>Регрессия и кластеризация</h2><p>Linear/Polynomial Regression, K-Means, DBSCAN. Выбор модели и кросс-валидация.</p>" },
    { moduleId: c5Modules[1].id, title: "Проект: анализ и предсказание", order: 4, content: "<h2>Финальный проект</h2><p>Полный DS-проект от сбора данных до презентации результатов. Kaggle competition формат.</p>" },
  ];

  const c5Lessons = [];
  for (const l of c5LessonsData) {
    const lesson = await prisma.lesson.create({
      data: { ...l, type: "VIDEO", videoUrl: VIDEO_URL, duration: randDuration(), isPublished: true },
    });
    c5Lessons.push(lesson);
  }
  console.log(`  Created ${c5Lessons.length} lessons (no enrollment)`);

  // ===== SUMMARY =====
  console.log("\n===== SEED COMPLETE =====");
  console.log("Courses created/updated: 5");
  console.log("1. React Advanced Patterns — admin enrolled, 5/8 completed (65%)");
  console.log("2. UI/UX Design Fundamentals — admin enrolled, 3/7 completed (42%)");
  console.log("3. TypeScript Deep Dive — admin enrolled, 7/8 completed (88%)");
  console.log("4. Modern Web Development — catalog only (no enrollment)");
  console.log("5. Data Science с Python — catalog only (no enrollment)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
