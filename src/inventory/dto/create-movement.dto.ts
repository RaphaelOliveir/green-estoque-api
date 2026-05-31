import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateMovementSchema = z.object({
  productId: z.string().uuid('ID de produto inválido'),
  type: z.enum(['ENTRY', 'EXIT'], {
    errorMap: () => ({
      message: "Tipo deve ser 'ENTRY' (entrada) ou 'EXIT' (saída)",
    }),
  }),
  quantity: z
    .number()
    .int()
    .positive('Quantidade deve ser um número inteiro positivo'),
  reason: z.string().max(500).optional(),
});

export class CreateMovementDto extends createZodDto(CreateMovementSchema) {}
