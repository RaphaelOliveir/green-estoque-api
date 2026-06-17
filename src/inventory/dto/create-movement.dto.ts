import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateMovementSchema = z
  .object({
    productId: z
      .string()
      .uuid('ID de produto inválido')
      .describe('ID do produto (UUID)'),
    type: z
      .enum(['ENTRY', 'EXIT'], {
        errorMap: () => ({
          message: "Tipo deve ser 'ENTRY' (entrada) ou 'EXIT' (saída)",
        }),
      })
      .describe("Tipo de movimentação: ENTRY (entrada de estoque) ou EXIT (saída de estoque)"),
    quantity: z
      .number()
      .int()
      .positive('Quantidade deve ser um número inteiro positivo')
      .describe('Quantidade de unidades movimentadas'),
    reason: z
      .string()
      .max(500)
      .optional()
      .describe('Motivo da movimentação (opcional, ex: "Venda", "Devolução")'),
  })
;

export class CreateMovementDto extends createZodDto(CreateMovementSchema) {}
