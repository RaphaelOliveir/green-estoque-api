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
    const existing = await this.prisma.product.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Já existe um produto com este código');

    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Categoria não encontrada');

    return this.prisma.product.create({
      data: {
        ...dto,
        price: new Prisma.Decimal(dto.price),
      },
      include: { category: true },
    });
  }

  async findAll(filter: FilterProductsDto) {
    const { search, brand, type, categoryId, code, lowStock, page, limit } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(brand && { brand: { contains: brand, mode: 'insensitive' } }),
      ...(type && { type: type as ProductType }),
      ...(categoryId && { categoryId }),
      ...(code && { code: { contains: code, mode: 'insensitive' } }),
      ...(lowStock && { quantity: { lte: LOW_STOCK_THRESHOLD } }),
    };

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: { category: true },
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
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async findByCode(code: string) {
    const product = await this.prisma.product.findUnique({
      where: { code },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async getStock(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, code: true, name: true, quantity: true, updatedAt: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return {
      ...product,
      isLowStock: product.quantity <= LOW_STOCK_THRESHOLD,
    };
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Categoria não encontrada');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.price !== undefined && { price: new Prisma.Decimal(dto.price) }),
      },
      include: { category: true },
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

  async getBrands() {
    const brands = await this.prisma.product.groupBy({
      by: ['brand'],
      orderBy: { brand: 'asc' },
    });
    return brands.map((b) => b.brand);
  }
}
