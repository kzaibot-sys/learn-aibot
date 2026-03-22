import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createConfiguredTestApp } from './create-test-app';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createConfiguredTestApp();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/v1/health returns status payload', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }: { body: { status: string; timestamp: string } }) => {
        expect(body.status).toBe('ok');
        expect(typeof body.timestamp).toBe('string');
      });

    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('unknown route returns standardized envelope', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/non-existing-route')
      .expect(404)
      .expect(
        ({
          body,
        }: {
          body: { code: string; message: string; requestId: string };
        }) => {
          expect(body.code).toBe('NOT_FOUND');
          expect(typeof body.message).toBe('string');
          expect(typeof body.requestId).toBe('string');
        },
      );
  });
});
