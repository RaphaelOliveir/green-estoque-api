import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
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
import { ItemStatus } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Estoque / Unidades Físicas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('units')
  @ApiOperation({
    summary: 'Listar unidades de estoque com filtros e paginação',
    description:
      'Retorna uma lista paginada de unidades individuais, com filtros opcionais por produto e status.',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Filtrar pelo ID do produto (UUID)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['EM_ESTOQUE', 'INSTALADO'],
    description: 'Filtrar por status da unidade',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: 20)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de unidades retornada com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado — token JWT ausente ou inválido.',
  })
  findAll(
    @Query('productId') productId?: string,
    @Query('status') status?: ItemStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.inventoryService.findAll({
      productId,
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('items/:id')
  @ApiOperation({
    summary: 'Buscar detalhes de uma unidade específica',
    description:
      'Retorna os detalhes de uma unidade individual de estoque pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da unidade (UUID)',
  })
  @ApiResponse({ status: 200, description: 'Unidade encontrada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Unidade não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch('items/:id')
  @ApiOperation({
    summary: 'Atualizar status de uma unidade',
    description:
      'Atualiza o status (EM_ESTOQUE, INSTALADO) e/ou as observações de uma unidade de estoque.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único da unidade (UUID)',
  })
  @ApiBody({ type: UpdateItemStatusDto, description: 'Dados de atualização' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Unidade não encontrada.' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItemStatusDto,
  ) {
    return this.inventoryService.updateStatus(id, dto);
  }

  @Get('products/:id/units')
  @ApiOperation({
    summary: 'Listar unidades de um produto',
    description:
      'Retorna todas as unidades de um produto específico, agrupadas e com sumário de quantidades.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do produto (UUID)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: 20)',
    example: 20,
  })
  @ApiResponse({ status: 200, description: 'Unidades retornadas com sucesso.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  findByProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.inventoryService.findByProduct(
      id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }
}
