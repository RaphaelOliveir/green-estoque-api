import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MovementType, ProductType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';

const mockProduct = {
  id: 'prod-1',
  code: 'CS-001',
  name: 'Solar Panel 400W',
  brand: 'Canadian Solar',
  type: ProductType.MONOCRYSTALLINE,
  wattage: 400,
  categoryId: 'cat-1',
  price: new Prisma.Decimal(850),
  quantity: 20,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMovement = {
  id: 'mov-1',
  productId: 'prod-1',
  type: MovementType.ENTRY,
  quantity: 10,
  reason: 'Purchase',
  userId: 'user-1',
  createdAt: new Date(),
  product: { id: 'prod-1', code: 'CS-001', name: 'Solar Panel 400W' },
  user: { id: 'user-1', name: 'Test User' },
};

const mockPrisma = {
  product: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  inventoryMovement: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    vi.clearAllMocks();
  });

  describe('createMovement', () => {
    it('should register an ENTRY movement and update stock', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.$transaction.mockResolvedValue([
        mockMovement,
        { ...mockProduct, quantity: 30 },
      ]);

      const result = await service.createMovement(
        {
          productId: 'prod-1',
          type: 'ENTRY',
          quantity: 10,
          reason: 'Purchase',
        },
        'user-1',
      );

      expect(result).toEqual(mockMovement);
      expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    });

    it('should register an EXIT movement when stock is sufficient', async () => {
      const exitMovement = {
        ...mockMovement,
        type: MovementType.EXIT,
        quantity: 5,
      };
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.$transaction.mockResolvedValue([
        exitMovement,
        { ...mockProduct, quantity: 15 },
      ]);

      const result = await service.createMovement(
        { productId: 'prod-1', type: 'EXIT', quantity: 5 },
        'user-1',
      );

      expect(result.type).toBe(MovementType.EXIT);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.createMovement(
          { productId: 'non-existent', type: 'EXIT', quantity: 1 },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when stock is insufficient for EXIT', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        quantity: 5,
      });

      await expect(
        service.createMovement(
          { productId: 'prod-1', type: 'EXIT', quantity: 10 },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findProductHistory', () => {
    it('should return product history with summary', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.inventoryMovement.count.mockResolvedValue(2);
      mockPrisma.inventoryMovement.findMany.mockResolvedValue([
        { ...mockMovement, type: MovementType.ENTRY, quantity: 10 },
        { ...mockMovement, id: 'mov-2', type: MovementType.EXIT, quantity: 5 },
      ]);

      const result = await service.findProductHistory('prod-1', 1, 20);

      expect(result).toHaveProperty('product');
      expect(result).toHaveProperty('movements');
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalEntries).toBe(10);
      expect(result.summary.totalExits).toBe(5);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.findProductHistory('non-existent', 1, 20),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
