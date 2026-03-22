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
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

describe('Assignments and certificates (e2e)', () => {
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

  it('student fetches assignment, submits, instructor grades', async () => {
    const prisma = app.get(PrismaService);
    const instructorEmail = uniqueEmail('asg-ins');
    const learnerEmail = uniqueEmail('asg-stu');

    await prisma.user.create({
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

    const slug = `e2e-asg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const courseRes = await request(app.getHttpServer())
      .post('/api/v1/instructor/courses')
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'Assignment Course',
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

    const les = await request(app.getHttpServer())
      .post(`/api/v1/instructor/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'Written lesson',
        type: LessonType.TEXT,
        order: 1,
        content: 'Read me',
      })
      .expect(201);

    const lessonId = (les.body as { id: string }).id;

    const assignment = await prisma.assignment.create({
      data: {
        lessonId,
        title: 'Essay',
        description: 'Write something',
        maxScore: 10,
      },
    });

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

    const learner = await prisma.user.findUniqueOrThrow({
      where: { email: learnerEmail },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(201);

    const getAsg = await request(app.getHttpServer())
      .get(`/api/v1/lessons/${lessonId}/assignment`)
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(200);

    const getBody = getAsg.body as {
      assignment: { id: string; maxScore: number };
      submission: null;
    };
    expect(getBody.assignment.id).toBe(assignment.id);
    expect(getBody.submission).toBeNull();

    const submit = await request(app.getHttpServer())
      .post(`/api/v1/assignments/${assignment.id}/submit`)
      .set('Authorization', `Bearer ${stuToken}`)
      .send({ content: 'My homework answer' })
      .expect(201);

    const subBody = submit.body as { status: string; userId: string };
    expect(subBody.status).toBe('SUBMITTED');
    expect(subBody.userId).toBe(learner.id);

    const grade = await request(app.getHttpServer())
      .post(`/api/v1/assignments/${assignment.id}/grade`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({ userId: learner.id, score: 8 })
      .expect(201);

    const gradeBody = grade.body as { status: string; score: number };
    expect(gradeBody.status).toBe('GRADED');
    expect(gradeBody.score).toBe(8);
  });

  it('issues certificate only when course progress is 100%', async () => {
    const prisma = app.get(PrismaService);
    const instructorEmail = uniqueEmail('cert-ins');
    const learnerEmail = uniqueEmail('cert-stu');

    await prisma.user.create({
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

    const slug = `e2e-cert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const courseRes = await request(app.getHttpServer())
      .post('/api/v1/instructor/courses')
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'Cert Course',
        slug,
        description: 'test',
      })
      .expect(201);

    const courseId = (courseRes.body as { id: string }).id;

    const mod = await request(app.getHttpServer())
      .post(`/api/v1/instructor/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({ title: 'M1', order: 1 })
      .expect(201);

    const moduleId = (mod.body as { id: string }).id;

    const les = await request(app.getHttpServer())
      .post(`/api/v1/instructor/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'L1',
        type: LessonType.TEXT,
        order: 1,
        content: 'x',
      })
      .expect(201);

    const lessonId = (les.body as { id: string }).id;

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

    const failIssue = await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/certificate/issue`)
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(400);
    expect((failIssue.body as { code: string }).code).toBe(
      'CERTIFICATE_NOT_ELIGIBLE',
    );

    await request(app.getHttpServer())
      .put(`/api/v1/lessons/${lessonId}/progress`)
      .set('Authorization', `Bearer ${stuToken}`)
      .send({
        watchedDuration: 0,
        completed: true,
      })
      .expect(200);

    const issue = await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/certificate/issue`)
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(201);

    const issueBody = issue.body as { courseId: string; id: string };
    expect(issueBody.courseId).toBe(courseId);

    const list = await request(app.getHttpServer())
      .get('/api/v1/users/me/certificates')
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(200);

    const listBody = list.body as Array<{
      courseId: string;
      course: { title: string };
    }>;
    expect(Array.isArray(listBody)).toBe(true);
    expect(listBody.some((c) => c.courseId === courseId)).toBe(true);
  });
});
