import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateProductSchema = z.object({
  code: z
    .string()
    .min(1, 'Código é obrigatório')
    .max(50)
    .regex(
      /^[A-Z0-9_-]+$/i,
      'Código deve conter apenas letras, números, hífens e underscores',
    ),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(255),
  description: z.string().max(1000).optional(),
  brand: z.string().min(1, 'Marca é obrigatória').max(100),
  type: z.enum(
    ['MONOCRYSTALLINE', 'POLYCRYSTALLINE', 'THIN_FILM', 'BIFACIAL'],
    {
      errorMap: () => ({
        message:
          'Tipo inválido. Use: MONOCRYSTALLINE, POLYCRYSTALLINE, THIN_FILM ou BIFACIAL',
      }),
    },
  ),
  wattage: z.number().int().positive('Wattagem deve ser positiva').optional(),
  categoryId: z.string().uuid('ID de categoria inválido'),
  price: z.number().positive('Preço deve ser positivo'),
  quantity: z
    .number()
    .int()
    .nonnegative('Quantidade não pode ser negativa')
    .default(0),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
