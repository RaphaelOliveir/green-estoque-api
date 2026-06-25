import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        ...dto,
        cost: new Prisma.Decimal(dto.cost),
      },
    });

    await this.prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        status: 'EM_ESTOQUE',
        observations: 'Estoque inicial do produto',
        name: product.name,
        vendor: product.vendor,
        customer: product.customer,
        purchaseDate: product.purchaseDate,
        entryStockDate: product.entryStockDate,
        cost: product.cost,
        type: product.type,
        description: product.description,
        image: product.image,
      },
    });

    return product;
  }

  async findAll(filter: FilterProductsDto) {
    const { search, vendor, type, page, limit } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { vendor: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(vendor && { vendor: { contains: vendor, mode: 'insensitive' } }),
      ...(type && { type: type }),
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

  // Removed findByCode as code field is deprecated

  async getStock(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        _count: {
          select: {
            movements: {
              where: { status: 'EM_ESTOQUE' },
            },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const quantity = product._count.movements;

    return {
      id: product.id,
      name: product.name,
      updatedAt: product.updatedAt,
      quantity,
      isLowStock: quantity <= LOW_STOCK_THRESHOLD,
    };
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.cost !== undefined && {
          cost: new Prisma.Decimal(dto.cost),
        }),
      },
    });

    await this.prisma.inventoryMovement.updateMany({
      where: { productId: id },
      data: {
        name: updatedProduct.name,
        vendor: updatedProduct.vendor,
        customer: updatedProduct.customer,
        purchaseDate: updatedProduct.purchaseDate,
        entryStockDate: updatedProduct.entryStockDate,
        cost: updatedProduct.cost,
        type: updatedProduct.type,
        description: updatedProduct.description,
        image: updatedProduct.image,
      },
    });

    return updatedProduct;
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    const installedUnits = await this.prisma.inventoryMovement.count({
      where: { productId: id, status: 'INSTALADO' },
    });

    if (installedUnits > 0) {
      throw new BadRequestException(
        'Não é possível remover um produto com unidades instaladas',
      );
    }

    // Use a transaction to safely delete all EM_ESTOQUE units and then the product
    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryMovement.deleteMany({
        where: { productId: id },
      });
      await tx.product.delete({ where: { id } });
    });

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
