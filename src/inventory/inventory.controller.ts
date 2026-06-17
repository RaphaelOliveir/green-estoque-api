import {
  Controller,
  Get,
  Post,
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
import { MovementType } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Estoque / Movimentações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post('movements')
  @ApiOperation({
    summary: 'Registrar entrada ou saída de estoque',
    description:
      'Registra uma movimentação de estoque (ENTRY = entrada / EXIT = saída). Saídas são validadas contra o estoque disponível — a operação é rejeitada se não houver quantidade suficiente.',
  })
  @ApiBody({ type: CreateMovementDto, description: 'Dados da movimentação' })
  @ApiResponse({
    status: 201,
    description: 'Movimentação registrada com sucesso. O estoque do produto é atualizado automaticamente.',
  })
  @ApiResponse({ status: 400, description: 'Estoque insuficiente para realizar a saída solicitada.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado para o productId informado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido.' })
  createMovement(
    @Body() dto: CreateMovementDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.inventoryService.createMovement(dto, user.id);
  }

  @Get('movements')
  @ApiOperation({
    summary: 'Listar movimentações com filtros e paginação',
    description: 'Retorna uma lista paginada de movimentações de estoque, com filtros opcionais por produto, tipo e usuário.',
  })
  @ApiQuery({ name: 'productId', required: false, description: 'Filtrar pelo ID do produto (UUID)' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['ENTRY', 'EXIT'],
    description: 'Filtrar por tipo de movimentação',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filtrar pelo ID do usuário responsável (UUID)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 20)', example: 20 })
  @ApiResponse({ status: 200, description: 'Lista de movimentações retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido.' })
  findAll(
    @Query('productId') productId?: string,
    @Query('type') type?: MovementType,
    @Query('userId') userId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.inventoryService.findAll({
      productId,
      type,
      userId,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('products/:id/history')
  @ApiOperation({
    summary: 'Histórico de movimentações por produto',
    description: 'Retorna o histórico completo de entradas e saídas de estoque de um produto específico, em ordem cronológica decrescente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do produto (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 20)', example: 20 })
  @ApiResponse({ status: 200, description: 'Histórico de movimentações retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido.' })
  findProductHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.inventoryService.findProductHistory(
      id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }
}
