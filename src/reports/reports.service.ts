// src/reports/reports.service.ts (full implementation)
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { GetTimelineDto } from './dto/get-timeline.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ---------- Existing Methods ----------
  async getMovementsReport(query: ReportQueryDto) {
    const { startDate, endDate, productId, status, vendor, page, limit } =
      query;
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
            select: { id: true, name: true, vendor: true },
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
        inStock: { count: inStockTotal?._count ?? 0 },
        installed: { count: installedTotal?._count ?? 0 },
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
              movements: { where: { status: 'EM_ESTOQUE' } },
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
    const lowStock = productsWithQty.filter(
      (p) => p.quantity > 0 && p.quantity <= 5,
    );
    const normalStock = productsWithQty.filter((p) => p.quantity > 5);

    const totalValue = productsWithQty.reduce(
      (sum, p) => sum + Number(p.cost) * p.quantity,
      0,
    );

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
    // Get counts per product for all movements (entries)
    const allEntries = await (this.prisma.inventoryMovement as any).groupBy({
      by: ['productId'],
      _count: true,
    });
    // Sort descending and take top N
    const topEntered = allEntries
      .sort((a: any, b: any) => b._count - a._count)
      .slice(0, limit);

    // Get counts per product for INSTALADO status (exits)
    const allExited = await (this.prisma.inventoryMovement as any).groupBy({
      by: ['productId'],
      where: { status: 'INSTALADO' },
      _count: true,
    });
    const topExited = allExited
      .sort((a: any, b: any) => b._count - a._count)
      .slice(0, limit);

    // Gather unique product IDs from both lists
    const productIds = Array.from(
      new Set([...topEntered, ...topExited].map((t: any) => t.productId)),
    );

    // Fetch product details
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, vendor: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    return {
      topEntries: topEntered.map((t: any) => ({
        product: productMap.get(t.productId),
        totalQuantity: t._count,
        movementsCount: t._count,
      })),
      topExits: topExited.map((t: any) => ({
        product: productMap.get(t.productId),
        totalQuantity: t._count,
        movementsCount: t._count,
      })),
    };
  }

  // ---------- New Report Methods ----------
  /** Overview: total in‑stock vs installed */
  async getOverview() {
    const [inStock, installed] = await Promise.all([
      this.prisma.inventoryMovement.count({ where: { status: 'EM_ESTOQUE' } }),
      this.prisma.inventoryMovement.count({ where: { status: 'INSTALADO' } }),
    ]);
    return { inStock, installed };
  }

  /** Types of products in stock */
  async getStockByType() {
    // Prisma's groupBy typing can be strict; cast to any to avoid TS errors
    const counts = await (this.prisma.inventoryMovement as any).groupBy({
      by: ['type'] as const,
      where: { status: 'EM_ESTOQUE' },
      _count: true,
    });
    const result = { solarPanel: 0, inverter: 0, structure: 0 };
    counts.forEach((c: any) => {
      switch (c.type) {
        case 'SOLAR_PANEL':
          result.solarPanel = c._count;
          break;
        case 'INVERTER':
          result.inverter = c._count;
          break;
        case 'STRUCTURE':
          result.structure = c._count;
          break;
      }
    });
    return result;
  }

  /** Timeline data for graphing */
  async getStockInstalledTimeline(dto: GetTimelineDto) {
    const { period, startDate, endDate } = dto;
    const where: Prisma.InventoryMovementWhereInput = {
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };
    const movements = await this.prisma.inventoryMovement.findMany({
      where,
      select: { status: true, createdAt: true },
    });
    const map = new Map<string, { inStock: number; installed: number }>();
    movements.forEach((m) => {
      const date = new Date(m.createdAt);
      let label: string;
      if (period === 'weekly') {
        const week = getISOWeek(date);
        const year = date.getUTCFullYear();
        label = `${year}-W${week}`;
      } else if (period === 'monthly') {
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();
        label = `${year}-${month.toString().padStart(2, '0')}`;
      } else {
        label = `${date.getUTCFullYear()}`;
      }
      const entry = map.get(label) ?? { inStock: 0, installed: 0 };
      if (m.status === 'EM_ESTOQUE') entry.inStock++;
      if (m.status === 'INSTALADO') entry.installed++;
      map.set(label, entry);
    });
    const result = Array.from(map.entries())
      .map(([periodLabel, counts]) => ({ periodLabel, ...counts }))
      .sort((a, b) => a.periodLabel.localeCompare(b.periodLabel));
    return result;
  }

  /** Best‑selling product (most INSTALLED) */
  async getBestSelling() {
    // Get counts per product for INSTALADO status
    const aggregated = await (this.prisma.inventoryMovement as any).groupBy({
      by: ['productId'] as const,
      where: { status: 'INSTALADO' },
      _count: true,
    });
    if (aggregated.length === 0) return null;
    // Find product with highest count
    const top = aggregated.reduce((prev: any, curr: any) =>
      curr._count > prev._count ? curr : prev,
    );
    const product = await this.prisma.product.findUnique({
      where: { id: top.productId },
    });
    return { productId: top.productId, count: top._count, product };
  }
}

// Helper to get ISO week number (compatible with ECMAScript)
function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
