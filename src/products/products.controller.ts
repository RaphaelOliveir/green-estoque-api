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
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Produtos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastrar novo produto',
    description:
      'Cria um novo produto no estoque. O código (UUID) é gerado automaticamente. A data de entrada em estoque (entryStockDate) também é definida automaticamente.',
  })
  @ApiBody({ type: CreateProductDto, description: 'Dados do produto a ser cadastrado' })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso. Retorna o objeto completo do produto criado, incluindo o código UUID gerado.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos — verifique os campos obrigatórios e seus formatos' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar produtos com filtros e paginação',
    description: 'Retorna uma lista paginada de produtos. Suporta busca por texto e filtros por tipo, fornecedor, código e estoque baixo.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Busca textual por nome, código ou fornecedor',
    example: 'Canadian Solar',
  })
  @ApiQuery({
    name: 'vendor',
    required: false,
    description: 'Filtrar por nome do fornecedor',
    example: 'Canadian Solar',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['SOLAR_PANEL', 'INVERTER', 'STRUCTURE'],
    description: 'Filtrar por tipo de produto',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    description: 'Filtrar pelo código UUID do produto',
  })
  @ApiQuery({
    name: 'lowStock',
    required: false,
    description: 'true = retorna apenas produtos com estoque ≤ 5 unidades',
    example: 'true',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 20, máx: 100)', example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos retornada com sucesso. Inclui metadados de paginação (total, página atual, total de páginas).',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido' })
  findAll(@Query() filter: FilterProductsDto) {
    return this.productsService.findAll(filter);
  }

  @Get('vendors')
  @ApiOperation({
    summary: 'Listar fornecedores disponíveis',
    description: 'Retorna uma lista de todos os fornecedores únicos cadastrados nos produtos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de nomes de fornecedores retornada com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido' })
  getVendors() {
    return this.productsService.getVendors();
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Buscar produto por código',
    description: 'Busca um produto específico pelo seu código único (UUID gerado automaticamente).',
  })
  @ApiParam({
    name: 'code',
    description: 'Código UUID único do produto',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Produto encontrado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado para o código informado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido' })
  findByCode(@Param('code') code: string) {
    return this.productsService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar produto por ID',
    description: 'Busca um produto específico pelo seu ID interno (UUID).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do produto (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Produto encontrado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado para o ID informado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/stock')
  @ApiOperation({
    summary: 'Verificar estoque disponível em tempo real',
    description: 'Retorna a quantidade atual em estoque do produto e indica se está com estoque baixo (≤ 5 unidades).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do produto (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna id, code, name, quantity, updatedAt e isLowStock do produto.',
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido' })
  getStock(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getStock(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar produto',
    description: 'Atualiza parcialmente os dados de um produto. Apenas os campos informados serão alterados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do produto (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({ type: UpdateProductDto, description: 'Campos a serem atualizados (todos opcionais)' })
  @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover produto',
    description: 'Remove permanentemente um produto do sistema. Não é possível remover produtos que possuam movimentações de estoque registradas.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do produto (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Produto removido com sucesso.' })
  @ApiResponse({ status: 400, description: 'Não é possível remover produto com movimentações registradas.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
