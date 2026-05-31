import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Produtos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cadastrar novo produto (Admin)' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Código de produto já cadastrado' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar produtos com filtros e paginação' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Busca por nome, código ou marca',
  })
  @ApiQuery({ name: 'brand', required: false })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['MONOCRYSTALLINE', 'POLYCRYSTALLINE', 'THIN_FILM', 'BIFACIAL'],
  })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({
    name: 'lowStock',
    required: false,
    description: 'Filtrar produtos com estoque baixo',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() filter: FilterProductsDto) {
    return this.productsService.findAll(filter);
  }

  @Get('brands')
  @ApiOperation({ summary: 'Listar todas as marcas disponíveis' })
  getBrands() {
    return this.productsService.getBrands();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Buscar produto por código' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  findByCode(@Param('code') code: string) {
    return this.productsService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Verificar estoque disponível em tempo real' })
  getStock(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getStock(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar produto (Admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remover produto (Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
