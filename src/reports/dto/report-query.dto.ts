import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ReportQuerySchema = z.object({
  startDate: z
    .string()
    .datetime({
      message: 'startDate deve estar no formato ISO 8601 (ex: 2024-01-01T00:00:00Z)',
    })
    .optional()
    .describe('Data de início do período (ISO 8601, ex: 2024-01-01T00:00:00Z)'),
  endDate: z
    .string()
    .datetime({ message: 'endDate deve estar no formato ISO 8601' })
    .optional()
    .describe('Data de fim do período (ISO 8601, ex: 2024-12-31T23:59:59Z)'),
  productId: z
    .string()
    .uuid()
    .optional()
    .describe('Filtrar pelo ID do produto (UUID)'),
  type: z
    .enum(['ENTRY', 'EXIT'])
    .optional()
    .describe("Filtrar por tipo: ENTRY (entradas) ou EXIT (saídas)"),
  vendor: z
    .string()
    .optional()
    .describe('Filtrar pelo nome do fornecedor'),
  page: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive())
    .default('1')
    .describe('Número da página (padrão: 1)'),
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive().max(100))
    .default('50')
    .describe('Quantidade de itens por página (padrão: 50, máximo: 100)'),
});

export class ReportQueryDto extends createZodDto(ReportQuerySchema) {}
