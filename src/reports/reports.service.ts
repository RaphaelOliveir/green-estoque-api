import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getMovementsReport(query: ReportQueryDto) {
    const {
      startDate,
      endDate,
      productId,
      status,
      vendor,
      page,
      limit,
    } = query;
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
      ...(status && { status }),
      ...(vendor && {
        product: { vendor: { contains: vendor, mode: 'insensitive' as const } },
      }),
    };

    const [total, movements] = await Promise.all([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              vendor: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totals = await this.prisma.inventoryMovement.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const inStockTotal = totals.find((t) => t.status === 'EM_ESTOQUE');
    const installedTotal = totals.find((t) => t.status === 'INSTALADO');

    return {
      summary: {
        period: { startDate, endDate },
        totalMovements: total,
        inStock: {
          count: inStockTotal?._count ?? 0,
        },
        installed: {
          count: installedTotal?._count ?? 0,
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
        include: {
          _count: {
            select: {
              movements: {
                where: { status: 'EM_ESTOQUE' },
              },
            },
          },
        },
      }),
      this.prisma.product.count(),
    ]);

    const productsWithQty = products.map((p) => {
      const quantity = p._count.movements;
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        vendor: p.vendor,
        customer: p.customer,
        purchaseDate: p.purchaseDate,
        entryStockDate: p.entryStockDate,
        cost: p.cost,
        type: p.type,
        description: p.description,
        image: p.image,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        quantity,
      };
    });

    productsWithQty.sort((a, b) => a.quantity - b.quantity);

    const outOfStock = productsWithQty.filter((p) => p.quantity === 0);
    const lowStock = productsWithQty.filter((p) => p.quantity > 0 && p.quantity <= 5);
    const normalStock = productsWithQty.filter((p) => p.quantity > 5);

    const totalValue = productsWithQty.reduce((sum, p) => {
      return sum + Number(p.cost) * p.quantity;
    }, 0);

    return {
      summary: {
        totalProducts,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        normalStock: normalStock.length,
        totalStockValue: totalValue.toFixed(2),
      },
      products: productsWithQty,
    };
  }

  async getTopMovedProducts(limit = 10) {
    const topEntered = await this.prisma.inventoryMovement.groupBy({
      by: ['productId'],
      _count: true,
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    const topExited = await this.prisma.inventoryMovement.groupBy({
      by: ['productId'],
      where: { status: 'INSTALADO' },
      _count: true,
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    const productIds = [
      ...new Set([...topEntered, ...topExited].map((t) => t.productId)),
    ];

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, code: true, name: true, vendor: true },
    });

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    return {
      topEntries: topEntered.map((t) => ({
        product: productMap[t.productId],
        totalQuantity: t._count,
        movementsCount: t._count,
      })),
      topExits: topExited.map((t) => ({
        product: productMap[t.productId],
        totalQuantity: t._count,
        movementsCount: t._count,
      })),
    };
  }
}
