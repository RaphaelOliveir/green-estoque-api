import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ItemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    productId?: string;
    status?: ItemStatus;
    page: number;
    limit: number;
  }) {
    const { productId, status, page, limit } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(productId && { productId }),
      ...(status && { status }),
    };

    const [total, items] = await Promise.all([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: {
            select: { id: true, code: true, name: true, vendor: true },
          },
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

  async findOne(id: string) {
    const item = await this.prisma.inventoryMovement.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, code: true, name: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('Unidade de estoque não encontrada');
    }

    return item;
  }

  async updateStatus(id: string, dto: UpdateItemStatusDto) {
    await this.findOne(id); // Ensure it exists

    return this.prisma.inventoryMovement.update({
      where: { id },
      data: {
        status: dto.status,
        observations: dto.observations,
      },
      include: {
        product: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async findByProduct(productId: string, page: number, limit: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.inventoryMovement.count({ where: { productId } }),
      this.prisma.inventoryMovement.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalEmEstoque = items.filter((m) => m.status === 'EM_ESTOQUE').length;
    const totalInstalado = items.filter((m) => m.status === 'INSTALADO').length;

    return {
      product: {
        id: product.id,
        code: product.code,
        name: product.name,
      },
      summary: { totalEmEstoque, totalInstalado },
      units: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
