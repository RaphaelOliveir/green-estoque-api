import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    const hashedPassword = await bcrypt.hash('Admin@1234', 10);
    await prisma.user.upsert({
      where: { email: 'admin-prod-test@test.com' },
      update: { password: hashedPassword },
      create: {
        name: 'Admin Products Test',
        email: 'admin-prod-test@test.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin-prod-test@test.com', password: 'Admin@1234' });

    adminToken = loginRes.body.access_token as string;

    const category = await prisma.category.create({
      data: {
        name: `Test Category ${Date.now()}`,
        description: 'E2E test category',
      },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.inventoryMovement.deleteMany({
      where: { product: { categoryId } },
    });
    await prisma.product.deleteMany({ where: { categoryId } });
    await prisma.category.delete({ where: { id: categoryId } });
    await prisma.user.deleteMany({
      where: { email: 'admin-prod-test@test.com' },
    });
    await app.close();
  });

  describe('POST /api/v1/products', () => {
    it('should create a product', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `E2E-PROD-${Date.now()}`,
          name: 'Painel Solar Teste 400W',
          brand: 'Brand E2E',
          type: 'MONOCRYSTALLINE',
          wattage: 400,
          categoryId,
          price: 850.0,
          quantity: 10,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Painel Solar Teste 400W');
      expect(response.body.quantity).toBe(10);
      productId = response.body.id as string;
    });

    it('should fail with invalid type', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'BAD-TYPE-001',
          name: 'Invalid Product',
          brand: 'Brand',
          type: 'INVALID_TYPE',
          categoryId,
          price: 100,
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({
          code: 'NO-AUTH',
          name: 'Test',
          brand: 'B',
          type: 'MONOCRYSTALLINE',
          categoryId,
          price: 100,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/products', () => {
    it('should list products with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ type: 'MONOCRYSTALLINE' })
        .expect(200);

      const allMono = response.body.data.every(
        (p: { type: string }) => p.type === 'MONOCRYSTALLINE',
      );
      expect(allMono).toBe(true);
    });
  });

  describe('GET /api/v1/products/:id/stock', () => {
    it('should return real-time stock for a product', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('quantity');
      expect(response.body).toHaveProperty('isLowStock');
    });
  });

  describe('PATCH /api/v1/products/:id', () => {
    it('should update a product', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Painel Solar Atualizado 400W', price: 900.0 })
        .expect(200);

      expect(response.body.name).toBe('Painel Solar Atualizado 400W');
    });
  });
});
