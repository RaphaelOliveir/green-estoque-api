import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Inventory (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let productId: string;
  let categoryId: string;

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
      where: { email: 'inv-test@test.com' },
      update: { password: hashedPassword },
      create: {
        name: 'Inventory Tester',
        email: 'inv-test@test.com',
        password: hashedPassword,
        role: 'OPERATOR',
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'inv-test@test.com', password: 'Admin@1234' });

    token = loginRes.body.access_token as string;

    const category = await prisma.category.create({
      data: { name: `Inv Test Category ${Date.now()}` },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        code: `INV-TEST-${Date.now()}`,
        name: 'Inventory Test Product',
        brand: 'TestBrand',
        type: 'MONOCRYSTALLINE',
        categoryId,
        price: 500,
        quantity: 20,
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.inventoryMovement.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.category.delete({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { email: 'inv-test@test.com' } });
    await app.close();
  });

  describe('POST /api/v1/inventory/movements', () => {
    it('should register an ENTRY movement and update stock', async () => {
      const before = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/stock`)
        .set('Authorization', `Bearer ${token}`);

      const stockBefore = before.body.quantity as number;

      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory/movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          type: 'ENTRY',
          quantity: 10,
          reason: 'Compra de fornecedor',
        })
        .expect(201);

      expect(res.body.type).toBe('ENTRY');
      expect(res.body.quantity).toBe(10);

      const after = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/stock`)
        .set('Authorization', `Bearer ${token}`);

      expect(after.body.quantity).toBe(stockBefore + 10);
    });

    it('should register an EXIT movement and update stock', async () => {
      const before = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/stock`)
        .set('Authorization', `Bearer ${token}`);

      const stockBefore = before.body.quantity as number;

      await request(app.getHttpServer())
        .post('/api/v1/inventory/movements')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId, type: 'EXIT', quantity: 5, reason: 'Venda' })
        .expect(201);

      const after = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/stock`)
        .set('Authorization', `Bearer ${token}`);

      expect(after.body.quantity).toBe(stockBefore - 5);
    });

    it('should reject EXIT when stock is insufficient', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory/movements')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId, type: 'EXIT', quantity: 99999 })
        .expect(400);

      expect(res.body.message).toContain('Estoque insuficiente');
    });

    it('should fail with non-positive quantity', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/inventory/movements')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId, type: 'ENTRY', quantity: 0 })
        .expect(400);
    });
  });

  describe('GET /api/v1/inventory/products/:id/history', () => {
    it('should return product movement history with summary', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/inventory/products/${productId}/history`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('product');
      expect(response.body).toHaveProperty('movements');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('totalEntries');
      expect(response.body.summary).toHaveProperty('totalExits');
    });
  });
});
