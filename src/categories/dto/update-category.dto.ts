import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateCategorySchema = z
  .object({
    name: z
      .string()
      .min(2)
      .max(100)
      .optional()
      .describe('Nome da categoria'),
    description: z
      .string()
      .max(500)
      .optional()
      .describe('Descrição da categoria'),
  })
;

export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}
