import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ReportQuerySchema = z.object({
  startDate: z
    .string()
    .datetime({
      message:
        'startDate deve estar no formato ISO 8601 (ex: 2024-01-01T00:00:00Z)',
    })
    .optional(),
  endDate: z
    .string()
    .datetime({ message: 'endDate deve estar no formato ISO 8601' })
    .optional(),
  productId: z.string().uuid().optional(),
  type: z.enum(['ENTRY', 'EXIT']).optional(),
  categoryId: z.string().uuid().optional(),
  brand: z.string().optional(),
  page: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive())
    .default('1'),
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive().max(100))
    .default('50'),
});

export class ReportQueryDto extends createZodDto(ReportQuerySchema) {}
