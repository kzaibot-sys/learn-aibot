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

interface EnrollResponseBody {
  enrolled: boolean;
  enrollment: { courseId: string };
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

describe('Auth & role-based flows (e2e)', () => {
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

  it('register then login returns tokens (PUBLIC)', async () => {
    const email = uniqueEmail('reg');

    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);

    const regBody = reg.body as AuthTokensBody;
    expect(regBody.accessToken).toBeDefined();
    expect(regBody.refreshToken).toBeDefined();

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    const loginBody = login.body as AuthTokensBody;
    expect(loginBody.accessToken).toBeDefined();
    expect(loginBody.refreshToken).toBeDefined();

    const prisma = app.get(PrismaService);
    await prisma.user.deleteMany({ where: { email } });
  });

  it('GET /users/me without token returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .expect(401)
      .expect(({ body }: { body: ApiErrorBody }) => {
        expect(body.code).toBe('UNAUTHORIZED');
      });
  });

  it('learner: register → login → enroll on published course (seeded in test)', async () => {
    const prisma = app.get(PrismaService);
    const instructorEmail = uniqueEmail('ins');
    const adminEmail = uniqueEmail('adm');
    const learnerEmail = uniqueEmail('stu');

    const instructor = await prisma.user.create({
      data: {
        email: instructorEmail,
        passwordHash: await hash(password, 10),
        role: Role.INSTRUCTOR,
      },
    });
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hash(password, 10),
        role: Role.ADMIN,
      },
    });

    const insLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: instructorEmail, password })
      .expect(201);
    const insToken = (insLogin.body as AuthTokensBody).accessToken;

    const slug = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const courseRes = await request(app.getHttpServer())
      .post('/api/v1/instructor/courses')
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'E2E Course',
        slug,
        description: 'test',
      })
      .expect(201);

    const courseBody = courseRes.body as { id: string };
    const courseId = courseBody.id;

    const mod = await request(app.getHttpServer())
      .post(`/api/v1/instructor/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({ title: 'Module 1', order: 1 })
      .expect(201);

    const moduleBody = mod.body as { id: string };
    await request(app.getHttpServer())
      .post(`/api/v1/instructor/modules/${moduleBody.id}/lessons`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'Lesson 1',
        type: LessonType.TEXT,
        order: 1,
        content: 'hello',
      })
      .expect(201);

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
      .expect(201)
      .expect(({ body }: { body: EnrollResponseBody }) => {
        expect(body.enrolled).toBe(true);
        expect(body.enrollment.courseId).toBe(courseId);
      });

    const list = await request(app.getHttpServer())
      .get('/api/v1/users/me/enrollments')
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(200);

    const found = (list.body as { course?: { id: string } }[]).some(
      (row) => row.course?.id === courseId,
    );
    expect(found).toBe(true);

    await prisma.user.delete({ where: { id: instructor.id } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, learnerEmail] } },
    });
  });

  it('STUDENT cannot access instructor-only endpoint (403)', async () => {
    const prisma = app.get(PrismaService);
    const email = uniqueEmail('student');

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    const token = (login.body as AuthTokensBody).accessToken;

    await request(app.getHttpServer())
      .post('/api/v1/instructor/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Forbidden course',
        slug: `no-${Date.now()}`,
      })
      .expect(403)
      .expect(({ body }: { body: ApiErrorBody }) => {
        expect(body.code).toBe('FORBIDDEN');
      });

    await prisma.user.deleteMany({ where: { email } });
  });

  it('STUDENT cannot access admin moderation list (403)', async () => {
    const prisma = app.get(PrismaService);
    const email = uniqueEmail('student-admin');

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    const token = (login.body as AuthTokensBody).accessToken;

    await request(app.getHttpServer())
      .get('/api/v1/admin/courses/moderation')
      .set('Authorization', `Bearer ${token}`)
      .expect(403)
      .expect(({ body }: { body: ApiErrorBody }) => {
        expect(body.code).toBe('FORBIDDEN');
      });

    await prisma.user.deleteMany({ where: { email } });
  });

  it('INSTRUCTOR cannot access admin moderation list (403)', async () => {
    const prisma = app.get(PrismaService);
    const email = uniqueEmail('instr-admin');

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
      .get('/api/v1/admin/courses/moderation')
      .set('Authorization', `Bearer ${token}`)
      .expect(403)
      .expect(({ body }: { body: ApiErrorBody }) => {
        expect(body.code).toBe('FORBIDDEN');
      });

    await prisma.user.delete({ where: { id: user.id } });
  });
});
