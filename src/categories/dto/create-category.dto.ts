import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateCategorySchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(100)
      .describe('Nome da categoria'),
    description: z
      .string()
      .max(500)
      .optional()
      .describe('Descrição da categoria (opcional)'),
  })
;

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
