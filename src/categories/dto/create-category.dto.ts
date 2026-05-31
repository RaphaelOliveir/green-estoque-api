import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  description: z.string().max(500).optional(),
});

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
