import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createMovement(dto: CreateMovementDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (dto.type === MovementType.EXIT && product.quantity < dto.quantity) {
      throw new BadRequestException(
        `Estoque insuficiente. Disponível: ${product.quantity}, Solicitado: ${dto.quantity}`,
      );
    }

    const quantityDelta =
      dto.type === MovementType.ENTRY ? dto.quantity : -dto.quantity;

    const [movement] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          quantity: dto.quantity,
          reason: dto.reason,
          userId,
        },
        include: {
          product: { select: { id: true, code: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { quantity: { increment: quantityDelta } },
      }),
    ]);

    return movement;
  }

  async findAll(params: {
    productId?: string;
    type?: MovementType;
    userId?: string;
    page: number;
    limit: number;
  }) {
    const { productId, type, userId, page, limit } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(productId && { productId }),
      ...(type && { type }),
      ...(userId && { userId }),
    };

    const [total, items] = await Promise.all([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: { select: { id: true, code: true, name: true, brand: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: items,
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

  async findProductHistory(productId: string, page: number, limit: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const skip = (page - 1) * limit;

    const [total, movements] = await Promise.all([
      this.prisma.inventoryMovement.count({ where: { productId } }),
      this.prisma.inventoryMovement.findMany({
        where: { productId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalEntries = movements
      .filter((m) => m.type === MovementType.ENTRY)
      .reduce((sum, m) => sum + m.quantity, 0);

    const totalExits = movements
      .filter((m) => m.type === MovementType.EXIT)
      .reduce((sum, m) => sum + m.quantity, 0);

    return {
      product: {
        id: product.id,
        code: product.code,
        name: product.name,
        currentQuantity: product.quantity,
      },
      summary: { totalEntries, totalExits },
      movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
