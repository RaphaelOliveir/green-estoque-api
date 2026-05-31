import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Relatório de movimentações por período' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO 8601 (ex: 2024-01-01T00:00:00Z)' })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['ENTRY', 'EXIT'] })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'brand', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMovementsReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getMovementsReport(query);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Relatório de estoque atual com resumo por status' })
  getStockReport() {
    return this.reportsService.getStockReport();
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Produtos com maior volume de movimentações' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopMovedProducts(@Query('limit') limit = '10') {
    return this.reportsService.getTopMovedProducts(parseInt(limit, 10));
  }
}
