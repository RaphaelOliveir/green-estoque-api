import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL },
  },
});

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.inventoryMovement.deleteMany();
  await prisma.product.deleteMany();
    // await prisma.category.deleteMany(); // Categories removed
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});
