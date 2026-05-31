import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}
