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
import { GetTimelineDto } from './dto/get-timeline.dto';
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
    description:
      'Data de início do período (ISO 8601, ex: 2024-01-01T00:00:00Z)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Data de fim do período (ISO 8601, ex: 2024-12-31T23:59:59Z)',
    example: '2024-12-31T23:59:59Z',
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
    name: 'vendor',
    required: false,
    description: 'Filtrar pelo nome do fornecedor',
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
    description: 'Itens por página (padrão: 50, máx: 100)',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório de movimentações retornado com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado — token JWT ausente ou inválido.',
  })
  getMovementsReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getMovementsReport(query);
  }

  @Get('stock')
  @ApiOperation({
    summary: 'Relatório de estoque atual',
    description:
      'Retorna um resumo do estado atual do estoque, incluindo total de produtos, quantidade total de itens, e agrupamento por tipo e status de estoque (normal/baixo/zerado).',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório de estoque retornado com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado — token JWT ausente ou inválido.',
  })
  getStockReport() {
    return this.reportsService.getStockReport();
  }

  @Get('overview')
  @ApiOperation({
    summary: 'Visão geral do estoque',
    description:
      'Retorna a quantidade total de produtos em estoque (EM_ESTOQUE) e instalados (INSTALADO).',
  })
  @ApiResponse({
    status: 200,
    description: 'Visão geral retornada com sucesso.',
  })
  getOverview() {
    return this.reportsService.getOverview();
  }

  @Get('stock-by-type')
  @ApiOperation({
    summary: 'Tipos de produtos em estoque',
    description:
      'Distribuição de produtos EM_ESTOQUE por tipo (SOLAR_PANEL, INVERTER, STRUCTURE).',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipos de produtos retornados com sucesso.',
  })
  getStockByType() {
    return this.reportsService.getStockByType();
  }

  @Get('timeline')
  @ApiOperation({
    summary: 'Linha do tempo de estoque e instalações',
    description: 'Dados agregados por semana, mês ou ano para uso em gráficos.',
  })
  @ApiQuery({
    name: 'period',
    required: true,
    enum: ['weekly', 'monthly', 'yearly'],
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Data inicial (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Data final (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados de timeline retornados com sucesso.',
  })
  getTimeline(@Query() query: GetTimelineDto) {
    return this.reportsService.getStockInstalledTimeline(query);
  }

  @Get('best-selling')
  @ApiOperation({
    summary: 'Produto mais vendido',
    description: 'Produto com maior número de movimentações INSTALADO.',
  })
  @ApiResponse({
    status: 200,
    description: 'Produto mais vendido retornado com sucesso.',
  })
  getBestSelling() {
    return this.reportsService.getBestSelling();
  }
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade de produtos a retornar (padrão: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista dos produtos mais movimentados retornada com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado — token JWT ausente ou inválido.',
  })
  getTopMovedProducts(@Query('limit') limit = '10') {
    return this.reportsService.getTopMovedProducts(parseInt(limit, 10));
  }
}
