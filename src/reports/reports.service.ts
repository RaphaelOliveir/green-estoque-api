import { Injectable } from '@nestjs/common';
import { MovementType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getMovementsReport(query: ReportQueryDto) {
    const { startDate, endDate, productId, type, categoryId, brand, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryMovementWhereInput = {
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
      ...(productId && { productId }),
      ...(type && { type: type as MovementType }),
      ...(categoryId && { product: { categoryId } }),
      ...(brand && { product: { brand: { contains: brand, mode: 'insensitive' as const } } }),
    };

    const [total, movements] = await Promise.all([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: {
            select: { id: true, code: true, name: true, brand: true, category: true },
          },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totals = await this.prisma.inventoryMovement.groupBy({
      by: ['type'],
      where,
      _sum: { quantity: true },
      _count: true,
    });

    const entriesTotal = totals.find((t) => t.type === MovementType.ENTRY);
    const exitsTotal = totals.find((t) => t.type === MovementType.EXIT);

    return {
      summary: {
        period: { startDate, endDate },
        totalMovements: total,
        entries: {
          count: entriesTotal?._count ?? 0,
          totalQuantity: entriesTotal?._sum.quantity ?? 0,
        },
        exits: {
          count: exitsTotal?._count ?? 0,
          totalQuantity: exitsTotal?._sum.quantity ?? 0,
        },
      },
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getStockReport() {
    const [products, totalProducts] = await Promise.all([
      this.prisma.product.findMany({
        include: { category: true },
        orderBy: { quantity: 'asc' },
      }),
      this.prisma.product.count(),
    ]);

    const outOfStock = products.filter((p) => p.quantity === 0);
    const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= 5);
    const normalStock = products.filter((p) => p.quantity > 5);

    const totalValue = products.reduce((sum, p) => {
      return sum + Number(p.price) * p.quantity;
    }, 0);

    const byCategory = await this.prisma.product.groupBy({
      by: ['categoryId'],
      _sum: { quantity: true },
      _count: true,
    });

    return {
      summary: {
        totalProducts,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        normalStock: normalStock.length,
        totalStockValue: totalValue.toFixed(2),
      },
      byCategory,
      products,
    };
  }

  async getTopMovedProducts(limit = 10) {
    const topEntered = await this.prisma.inventoryMovement.groupBy({
      by: ['productId'],
      where: { type: MovementType.ENTRY },
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const topExited = await this.prisma.inventoryMovement.groupBy({
      by: ['productId'],
      where: { type: MovementType.EXIT },
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = [...new Set([...topEntered, ...topExited].map((t) => t.productId))];

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, code: true, name: true, brand: true },
    });

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    return {
      topEntries: topEntered.map((t) => ({
        product: productMap[t.productId],
        totalQuantity: t._sum.quantity,
        movementsCount: t._count,
      })),
      topExits: topExited.map((t) => ({
        product: productMap[t.productId],
        totalQuantity: t._sum.quantity,
        movementsCount: t._count,
      })),
    };
  }
}
