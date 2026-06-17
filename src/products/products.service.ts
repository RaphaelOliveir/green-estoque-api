import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ProductType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        cost: new Prisma.Decimal(dto.cost),
      },
    });
  }

  async findAll(filter: FilterProductsDto) {
    const { search, vendor, type, code, lowStock, page, limit } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { vendor: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(vendor && { vendor: { contains: vendor, mode: 'insensitive' } }),
      ...(type && { type: type }),
      ...(code && { code: { contains: code, mode: 'insensitive' } }),
      ...(lowStock && { quantity: { lte: LOW_STOCK_THRESHOLD } }),
    };

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
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
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async findByCode(code: string) {
    const product = await this.prisma.product.findUnique({
      where: { code },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async getStock(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        quantity: true,
        updatedAt: true,
      },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return {
      ...product,
      isLowStock: product.quantity <= LOW_STOCK_THRESHOLD,
    };
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.cost !== undefined && {
          cost: new Prisma.Decimal(dto.cost),
        }),
      },
    });
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    const movementsCount = await this.prisma.inventoryMovement.count({
      where: { productId: id },
    });

    if (movementsCount > 0) {
      throw new BadRequestException(
        'Não é possível remover um produto com movimentações registradas',
      );
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: `Produto "${product.name}" removido com sucesso` };
  }

  async getVendors() {
    const vendors = await this.prisma.product.groupBy({
      by: ['vendor'],
      orderBy: { vendor: 'asc' },
    });
    return vendors.map((b) => b.vendor);
  }
}
