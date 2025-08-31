import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('SMILe Sales Funnel API - Phase 0');
  });

  it('/tasks (GET)', () => {
    return request(app.getHttpServer())
      .get('/tasks')
      .expect(200)
      .expect({
        tasks: [],
        message: 'Tasks endpoint - stub implementation'
      });
  });

  it('/deals (GET)', () => {
    return request(app.getHttpServer())
      .get('/deals')
      .expect(200)
      .expect({
        deals: [],
        message: 'Deals endpoint - stub implementation'
      });
  });
});