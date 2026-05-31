import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const FilterProductsSchema = z.object({
  search: z.string().optional(),
  brand: z.string().optional(),
  type: z
    .enum(['MONOCRYSTALLINE', 'POLYCRYSTALLINE', 'THIN_FILM', 'BIFACIAL'])
    .optional(),
  categoryId: z.string().uuid().optional(),
  code: z.string().optional(),
  lowStock: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  page: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive())
    .default('1'),
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive().max(100))
    .default('20'),
});

export class FilterProductsDto extends createZodDto(FilterProductsSchema) {}
