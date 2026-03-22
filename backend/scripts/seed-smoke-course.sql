INSERT INTO "User" (id, email, "passwordHash", role, "createdAt", "updatedAt")
VALUES ('seed_instructor_1', 'instructor.seed@example.com', 'seed-hash', 'INSTRUCTOR', NOW(), NOW())
ON CONFLICT (email)
DO UPDATE SET role = 'INSTRUCTOR', "updatedAt" = NOW();

INSERT INTO "Course" (id, slug, title, description, category, level, language, status, "ownerId", "createdAt", "updatedAt")
VALUES (
  'seed_course_1',
  'smoke-course-1',
  'Smoke Course 1',
  'Seeded for smoke test',
  'AI',
  'Beginner',
  'ru',
  'PUBLISHED',
  'seed_instructor_1',
  NOW(),
  NOW()
)
ON CONFLICT (slug)
DO UPDATE SET
  title = EXCLUDED.title,
  status = 'PUBLISHED',
  "ownerId" = EXCLUDED."ownerId",
  "updatedAt" = NOW();

INSERT INTO "Module" (id, title, "order", "courseId", "createdAt", "updatedAt")
VALUES ('seed_module_1', 'Getting Started', 1, 'seed_course_1', NOW(), NOW())
ON CONFLICT ("courseId", "order")
DO UPDATE SET
  title = EXCLUDED.title,
  "updatedAt" = NOW();

INSERT INTO "Lesson" (id, title, type, "contentUrl", content, "order", "moduleId", "createdAt", "updatedAt")
VALUES
  (
    'seed_lesson_1',
    'Welcome lesson',
    'VIDEO',
    'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    NULL,
    1,
    'seed_module_1',
    NOW(),
    NOW()
  ),
  (
    'seed_lesson_2',
    'Second lesson',
    'VIDEO',
    'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    NULL,
    2,
    'seed_module_1',
    NOW(),
    NOW()
  )
ON CONFLICT ("moduleId", "order")
DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  "contentUrl" = EXCLUDED."contentUrl",
  content = EXCLUDED.content,
  "updatedAt" = NOW();
