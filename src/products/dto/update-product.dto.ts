import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateProductSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).optional(),
  brand: z.string().min(1).max(100).optional(),
  type: z
    .enum(['MONOCRYSTALLINE', 'POLYCRYSTALLINE', 'THIN_FILM', 'BIFACIAL'])
    .optional(),
  wattage: z.number().int().positive().optional(),
  categoryId: z.string().uuid().optional(),
  price: z.number().positive().optional(),
});

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
