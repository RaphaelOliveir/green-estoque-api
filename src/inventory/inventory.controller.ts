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
  @ApiOperation({ summary: 'Registrar entrada ou saída de estoque' })
  @ApiResponse({
    status: 201,
    description: 'Movimentação registrada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Estoque insuficiente' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  createMovement(
    @Body() dto: CreateMovementDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.inventoryService.createMovement(dto, user.id);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Listar movimentações com filtros e paginação' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['ENTRY', 'EXIT'] })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
  @ApiOperation({ summary: 'Histórico de entradas e saídas por produto' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
