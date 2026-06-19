import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateProductSchema = z
  .object({
    name: z
      .string()
      .min(2)
      .max(255)
      .optional()
      .describe('Nome do produto'),
    vendor: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .describe('Nome do fornecedor'),
    customer: z
      .string()
      .max(100)
      .optional()
      .describe('Nome do cliente (opcional)'),
    purchaseDate: z
      .string()
      .datetime({ message: 'Data de compra deve estar no formato ISO 8601 (ex: 2024-01-15T00:00:00.000Z)' })
      .transform((v) => new Date(v))
      .optional()
      .describe('Data de compra do produto (ISO 8601, ex: 2024-01-15T00:00:00.000Z)'),

    cost: z
      .number()
      .positive()
      .optional()
      .describe('Custo de aquisição do produto em reais (BRL)'),
    type: z
      .enum(['SOLAR_PANEL', 'INVERTER', 'STRUCTURE'])
      .optional()
      .describe('Tipo do produto: SOLAR_PANEL, INVERTER ou STRUCTURE'),
    description: z
      .string()
      .max(1000)
      .optional()
      .describe('Descrição detalhada do produto'),
    image: z
      .string()
      .url()
      .optional()
      .describe('URL da imagem do produto'),
  })
;

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
