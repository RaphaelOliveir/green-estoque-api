import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Relatórios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('movements')
  @ApiOperation({
    summary: 'Relatório de movimentações por período',
    description:
      'Retorna um relatório paginado de movimentações de estoque com filtros por período, produto, tipo e fornecedor.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Data de início do período (ISO 8601, ex: 2024-01-01T00:00:00Z)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Data de fim do período (ISO 8601, ex: 2024-12-31T23:59:59Z)',
    example: '2024-12-31T23:59:59Z',
  })
  @ApiQuery({ name: 'productId', required: false, description: 'Filtrar pelo ID do produto (UUID)' })
  @ApiQuery({ name: 'type', required: false, enum: ['ENTRY', 'EXIT'], description: 'Filtrar por tipo de movimentação' })
  @ApiQuery({ name: 'vendor', required: false, description: 'Filtrar pelo nome do fornecedor' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 50, máx: 100)', example: 50 })
  @ApiResponse({ status: 200, description: 'Relatório de movimentações retornado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido.' })
  getMovementsReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getMovementsReport(query);
  }

  @Get('stock')
  @ApiOperation({
    summary: 'Relatório de estoque atual',
    description:
      'Retorna um resumo do estado atual do estoque, incluindo total de produtos, quantidade total de itens, e agrupamento por tipo e status de estoque (normal/baixo/zerado).',
  })
  @ApiResponse({ status: 200, description: 'Relatório de estoque retornado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido.' })
  getStockReport() {
    return this.reportsService.getStockReport();
  }

  @Get('top-products')
  @ApiOperation({
    summary: 'Produtos com maior volume de movimentações',
    description: 'Retorna os produtos com o maior número de movimentações de estoque registradas (entradas + saídas).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade de produtos a retornar (padrão: 10)',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Lista dos produtos mais movimentados retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado — token JWT ausente ou inválido.' })
  getTopMovedProducts(@Query('limit') limit = '10') {
    return this.reportsService.getTopMovedProducts(parseInt(limit, 10));
  }
}
