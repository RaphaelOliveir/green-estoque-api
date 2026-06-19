import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { ItemStatus } from '@prisma/client';

describe('Inventory (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let productId: string;
  let itemId: string;

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
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'inv-test@test.com', password: 'Admin@1234' });

    token = loginRes.body.access_token as string;

    const product = await prisma.product.create({
      data: {
        name: 'Inventory Test Product',
        vendor: 'TestVendor',
        type: 'SOLAR_PANEL',
        cost: 500,
        purchaseDate: new Date(),
      },
    });
    productId = product.id;

    // Create 2 units
    await prisma.inventoryMovement.createMany({
      data: [
        { productId, status: ItemStatus.EM_ESTOQUE },
        { productId, status: ItemStatus.EM_ESTOQUE },
      ],
    });

    const items = await prisma.inventoryMovement.findMany({
      where: { productId },
    });
    itemId = items[0].id;
  });

  afterAll(async () => {
    await prisma.inventoryMovement.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.user.deleteMany({ where: { email: 'inv-test@test.com' } });
    await app.close();
  });

  describe('GET /api/v1/inventory/units', () => {
    it('should return a paginated list of units', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/inventory/units')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by productId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/inventory/units?productId=${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].productId).toBe(productId);
    });
  });

  describe('GET /api/v1/inventory/items/:id', () => {
    it('should return a single unit by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/inventory/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(itemId);
      expect(response.body.status).toBe(ItemStatus.EM_ESTOQUE);
    });
  });

  describe('PATCH /api/v1/inventory/items/:id', () => {
    it('should update the status of a unit', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/inventory/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'INSTALADO', observations: 'Instalado no cliente' })
        .expect(200);

      expect(res.body.status).toBe('INSTALADO');
      expect(res.body.observations).toBe('Instalado no cliente');

      // Check stock dynamically
      const stockRes = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/stock`)
        .set('Authorization', `Bearer ${token}`);

      expect(stockRes.body.quantity).toBe(1); // One is installed, one remains
    });
  });

  describe('GET /api/v1/inventory/products/:id/units', () => {
    it('should return product units with summary', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/inventory/products/${productId}/units`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('product');
      expect(response.body).toHaveProperty('units');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary.totalEmEstoque).toBe(1);
      expect(response.body.summary.totalInstalado).toBe(1);
    });
  });
});
