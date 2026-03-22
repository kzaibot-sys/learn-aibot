import { INestApplication } from '@nestjs/common';
import { hash } from 'bcrypt';
import { LessonType, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { createConfiguredTestApp } from './create-test-app';

const password = 'e2ePass12';

interface AuthTokensBody {
  accessToken: string;
  refreshToken: string;
}

interface ApiErrorBody {
  code: string;
}

interface ActivityItemBody {
  type: string;
  courseId: string;
  courseTitle: string;
  lessonId: string | null;
  lessonTitle: string | null;
  timestamp: string;
  meta: Record<string, unknown>;
}

interface ActivityResponseBody {
  items: ActivityItemBody[];
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

function assertActivityItem(item: unknown): asserts item is ActivityItemBody {
  expect(item).toEqual(expect.any(Object));
  if (typeof item !== 'object' || item === null) {
    throw new Error('expected object');
  }
  const row = item as Record<string, unknown>;
  expect(typeof row.type).toBe('string');
  expect(typeof row.courseId).toBe('string');
  expect(typeof row.courseTitle).toBe('string');
  expect(typeof row.timestamp).toBe('string');
  expect(typeof row.meta).toBe('object');
  expect(row.meta).not.toBeNull();

  const lessonId = row.lessonId;
  const lessonTitle = row.lessonTitle;
  expect(
    lessonId === null || (typeof lessonId === 'string' && lessonId.length > 0),
  ).toBe(true);
  expect(
    lessonTitle === null ||
      (typeof lessonTitle === 'string' && lessonTitle.length > 0),
  ).toBe(true);
}

describe('GET /users/me/activity (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createConfiguredTestApp();
    const prisma = app.get(PrismaService);
    if (process.env.NODE_ENV === 'test') {
      await prisma.$connect();
    }
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns 401 without Bearer token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/me/activity')
      .expect(401)
      .expect(({ body }: { body: ApiErrorBody }) => {
        expect(body.code).toBe('UNAUTHORIZED');
      });
  });

  it('returns 403 for INSTRUCTOR role', async () => {
    const prisma = app.get(PrismaService);
    const email = uniqueEmail('ins-activity');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hash(password, 10),
        role: Role.INSTRUCTOR,
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    const token = (login.body as AuthTokensBody).accessToken;

    await request(app.getHttpServer())
      .get('/api/v1/users/me/activity')
      .set('Authorization', `Bearer ${token}`)
      .expect(403)
      .expect(({ body }: { body: ApiErrorBody }) => {
        expect(body.code).toBe('FORBIDDEN');
      });

    await prisma.user.delete({ where: { id: user.id } });
  });

  it('returns { items: [] } for STUDENT with no enrollments', async () => {
    const prisma = app.get(PrismaService);
    const email = uniqueEmail('stu-activity-empty');

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    const token = (login.body as AuthTokensBody).accessToken;

    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me/activity')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as ActivityResponseBody;
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items).toEqual([]);

    await prisma.user.deleteMany({ where: { email } });
  });

  it('returns ENROLLED and LESSON_PROGRESS items after enroll + progress', async () => {
    const prisma = app.get(PrismaService);
    const instructorEmail = uniqueEmail('ins-act-flow');
    const learnerEmail = uniqueEmail('stu-act-flow');

    const instructor = await prisma.user.create({
      data: {
        email: instructorEmail,
        passwordHash: await hash(password, 10),
        role: Role.INSTRUCTOR,
      },
    });

    const insLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: instructorEmail, password })
      .expect(201);
    const insToken = (insLogin.body as AuthTokensBody).accessToken;

    const slug = `e2e-act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const courseRes = await request(app.getHttpServer())
      .post('/api/v1/instructor/courses')
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'Activity Course',
        slug,
        description: 'test',
      })
      .expect(201);

    const courseId = (courseRes.body as { id: string }).id;

    const mod = await request(app.getHttpServer())
      .post(`/api/v1/instructor/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({ title: 'Module 1', order: 1 })
      .expect(201);

    const moduleId = (mod.body as { id: string }).id;

    const lessonRes = await request(app.getHttpServer())
      .post(`/api/v1/instructor/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'Lesson A',
        type: LessonType.TEXT,
        order: 1,
        content: 'hello',
      })
      .expect(201);

    const lessonId = (lessonRes.body as { id: string }).id;

    await request(app.getHttpServer())
      .post(`/api/v1/instructor/courses/${courseId}/publish`)
      .set('Authorization', `Bearer ${insToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: learnerEmail, password })
      .expect(201);

    const stuLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: learnerEmail, password })
      .expect(201);
    const stuToken = (stuLogin.body as AuthTokensBody).accessToken;

    await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .put(`/api/v1/lessons/${lessonId}/progress`)
      .set('Authorization', `Bearer ${stuToken}`)
      .send({ watchedDuration: 42, completed: false })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me/activity')
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(200);

    const body = res.body as ActivityResponseBody;
    expect(body.items.length).toBeGreaterThanOrEqual(2);
    for (const item of body.items) {
      assertActivityItem(item);
    }

    const types = body.items.map((i) => i.type);
    expect(types).toContain('ENROLLED');
    expect(types).toContain('LESSON_PROGRESS');

    const progressItem = body.items.find((i) => i.type === 'LESSON_PROGRESS');
    expect(progressItem).toBeDefined();
    expect(progressItem!.lessonId).toBe(lessonId);
    expect(progressItem!.meta.watchedDuration).toBe(42);
    expect(progressItem!.meta.completed).toBe(false);

    await prisma.user.delete({ where: { id: instructor.id } });
    await prisma.user.deleteMany({ where: { email: learnerEmail } });
  });
});
