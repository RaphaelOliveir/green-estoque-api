import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

const mockProduct = {
  id: 'prod-1',
  code: 'uuid-code-123',
  name: 'Canadian Solar 400W',
  vendor: 'Canadian Solar',
  customer: null,
  purchaseDate: new Date(),
  entryStockDate: new Date(),
  cost: new Prisma.Decimal(850),
  type: 'SOLAR_PANEL' as any,
  description: null,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  product: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  inventoryMovement: {
    count: vi.fn(),
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product successfully with units in transaction', async () => {
      mockPrisma.product.create.mockResolvedValue(mockProduct);
      mockPrisma.inventoryMovement.createMany.mockResolvedValue({ count: 50 });

      const dto = {
        name: 'Canadian Solar 400W',
        vendor: 'Canadian Solar',
        purchaseDate: new Date(),
        cost: 850,
        quantity: 50,
        type: 'SOLAR_PANEL' as const,
      };

      const result = await service.create(dto);

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.create).toHaveBeenCalledOnce();
      expect(mockPrisma.inventoryMovement.createMany).toHaveBeenCalledOnce();
      const callArgs = mockPrisma.inventoryMovement.createMany.mock.calls[0][0];
      expect(callArgs.data).toHaveLength(50);
    });
  });

  describe('findOne', () => {
    it('should return a product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('prod-1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStock', () => {
    it('should return stock info with dynamically counted units', async () => {
      const productWithCount = {
        ...mockProduct,
        _count: { movements: 3 },
      };
      mockPrisma.product.findUnique.mockResolvedValue(productWithCount);

      const result = await service.getStock('prod-1');

      expect(result.quantity).toBe(3);
      expect(result.isLowStock).toBe(true);
    });

    it('should mark product as NOT low stock when count > 5', async () => {
      const productWithCount = {
        ...mockProduct,
        _count: { movements: 10 },
      };
      mockPrisma.product.findUnique.mockResolvedValue(productWithCount);

      const result = await service.getStock('prod-1');

      expect(result.quantity).toBe(10);
      expect(result.isLowStock).toBe(false);
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException when product has INSTALADO units', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.inventoryMovement.count.mockResolvedValue(1); // 1 INSTALADO

      await expect(service.remove('prod-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete product successfully when no INSTALADO units exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.inventoryMovement.count.mockResolvedValue(0);
      mockPrisma.inventoryMovement.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove('prod-1');

      expect(mockPrisma.inventoryMovement.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.product.delete).toHaveBeenCalled();
      expect(result.message).toContain('removido');
    });
  });
});
