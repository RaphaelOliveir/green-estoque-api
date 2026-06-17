import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ProductType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

const mockCategory = { id: 'cat-1', name: 'Residencial' };

const mockProduct = {
  id: 'prod-1',
  code: 'uuid-code-123',
  name: 'Canadian Solar 400W',
  vendor: 'Canadian Solar',
  customer: null,
  purchaseDate: new Date(),
  entryStockDate: new Date(),
  quantity: 50,
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
  category: {
    findUnique: vi.fn(),
  },
  inventoryMovement: {
    count: vi.fn(),
  },
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
    it('should create a product successfully', async () => {
      mockPrisma.product.create.mockResolvedValue(mockProduct);

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
    it('should return stock info with isLowStock flag', async () => {
      const lowStockProduct = {
        id: 'prod-1',
        code: 'CS-001',
        name: 'Product',
        quantity: 3,
        updatedAt: new Date(),
      };
      mockPrisma.product.findUnique.mockResolvedValue(lowStockProduct);

      const result = await service.getStock('prod-1');

      expect(result.isLowStock).toBe(true);
      expect(result.quantity).toBe(3);
    });

    it('should mark product as NOT low stock when quantity > 5', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        code: 'CS-001',
        name: 'Product',
        quantity: 100,
        updatedAt: new Date(),
      });

      const result = await service.getStock('prod-1');

      expect(result.isLowStock).toBe(false);
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException when product has movements', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.inventoryMovement.count.mockResolvedValue(5);

      await expect(service.remove('prod-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete product successfully when no movements exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.inventoryMovement.count.mockResolvedValue(0);
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove('prod-1');

      expect(result.message).toContain('removido');
    });
  });
});
