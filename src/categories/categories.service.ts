import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });
    if (existing)
      throw new ConflictException('Categoria já cadastrada com este nome');

    return this.prisma.category.create({ data: dto });
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.category.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing)
        throw new ConflictException('Já existe uma categoria com este nome');
    }

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.category.delete({ where: { id } });
    return { message: 'Categoria removida com sucesso' };
  }
}
