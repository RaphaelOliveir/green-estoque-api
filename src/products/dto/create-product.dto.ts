import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateProductSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(255)
      .describe('Nome do produto'),
    vendor: z
      .string()
      .min(1, 'Fornecedor é obrigatório')
      .max(100)
      .describe('Nome do fornecedor'),
    customer: z
      .string()
      .max(100)
      .optional()
      .describe('Nome do cliente (opcional)'),
    purchaseDate: z
      .string({
        required_error: 'Data de compra é obrigatória',
        invalid_type_error: 'Formato de data inválido',
      })
      .datetime({ message: 'Data de compra deve estar no formato ISO 8601 (ex: 2024-01-15T00:00:00.000Z)' })
      .transform((v) => new Date(v))
      .describe('Data de compra do produto (ISO 8601, ex: 2024-01-15T00:00:00.000Z)'),
    quantity: z
      .number()
      .int()
      .min(1, 'Quantidade deve ser no mínimo 1')
      .describe('Quantidade em estoque (mínimo: 1)'),
    cost: z
      .number()
      .positive('Custo deve ser positivo')
      .describe('Custo de aquisição do produto em reais (BRL)'),
    type: z
      .enum(['SOLAR_PANEL', 'INVERTER', 'STRUCTURE'], {
        errorMap: () => ({
          message: 'Tipo inválido. Use: SOLAR_PANEL, INVERTER ou STRUCTURE',
        }),
      })
      .describe('Tipo do produto: SOLAR_PANEL (Painel Solar), INVERTER (Inversor) ou STRUCTURE (Estrutura)'),
    description: z
      .string()
      .max(1000)
      .optional()
      .describe('Descrição detalhada do produto (opcional)'),
    image: z
      .string()
      .url('Imagem deve ser uma URL válida')
      .optional()
      .describe('URL da imagem do produto (opcional)'),
  })
;

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
