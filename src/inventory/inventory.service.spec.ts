import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ItemStatus } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';

const mockProduct = {
  id: 'prod-1',
  code: 'CS-001',
  name: 'Solar Panel 400W',
  vendor: 'Canadian Solar',
};

const mockItem = {
  id: 'item-1',
  productId: 'prod-1',
  status: ItemStatus.EM_ESTOQUE,
  observations: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  product: mockProduct,
};

const mockPrisma = {
  product: {
    findUnique: vi.fn(),
  },
  inventoryMovement: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
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

  describe('findAll', () => {
    it('should return paginated items with meta data', async () => {
      mockPrisma.inventoryMovement.count.mockResolvedValue(1);
      mockPrisma.inventoryMovement.findMany.mockResolvedValue([mockItem]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0]).toEqual(mockItem);
    });
  });

  describe('findOne', () => {
    it('should find and return an item', async () => {
      mockPrisma.inventoryMovement.findUnique.mockResolvedValue(mockItem);

      const result = await service.findOne('item-1');

      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockPrisma.inventoryMovement.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update item status', async () => {
      mockPrisma.inventoryMovement.findUnique.mockResolvedValue(mockItem);
      mockPrisma.inventoryMovement.update.mockResolvedValue({
        ...mockItem,
        status: ItemStatus.INSTALADO,
      });

      const result = await service.updateStatus('item-1', {
        status: ItemStatus.INSTALADO,
      });

      expect(result.status).toBe(ItemStatus.INSTALADO);
      expect(mockPrisma.inventoryMovement.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { status: ItemStatus.INSTALADO, observations: undefined },
        include: {
          product: { select: { id: true, code: true, name: true } },
        },
      });
    });
  });

  describe('findByProduct', () => {
    it('should return product history with summary', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.inventoryMovement.count.mockResolvedValue(2);
      mockPrisma.inventoryMovement.findMany.mockResolvedValue([
        { ...mockItem, status: ItemStatus.EM_ESTOQUE },
        { ...mockItem, id: 'item-2', status: ItemStatus.INSTALADO },
      ]);

      const result = await service.findByProduct('prod-1', 1, 20);

      expect(result).toHaveProperty('product');
      expect(result).toHaveProperty('units');
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalEmEstoque).toBe(1);
      expect(result.summary.totalInstalado).toBe(1);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.findByProduct('non-existent', 1, 20),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
