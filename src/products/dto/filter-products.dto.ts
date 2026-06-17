import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const FilterProductsSchema = z.object({
  search: z
    .string()
    .optional()
    .describe('Busca por nome, código ou fornecedor'),
  vendor: z
    .string()
    .optional()
    .describe('Filtrar por nome do fornecedor'),
  type: z
    .enum(['SOLAR_PANEL', 'INVERTER', 'STRUCTURE'])
    .optional()
    .describe('Filtrar por tipo: SOLAR_PANEL, INVERTER ou STRUCTURE'),
  code: z
    .string()
    .optional()
    .describe('Filtrar pelo código único do produto (UUID)'),
  lowStock: z
    .string()
    .transform((v) => v === 'true')
    .optional()
    .describe('Filtrar apenas produtos com estoque baixo (≤ 5 unidades)'),
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
    .default('20')
    .describe('Quantidade de itens por página (padrão: 20, máximo: 100)'),
});

export class FilterProductsDto extends createZodDto(FilterProductsSchema) {}
