import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .optional()
    .describe('Nome completo do usuário'),
  email: z
    .string()
    .email()
    .optional()
    .describe('Endereço de e-mail do usuário'),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .optional()
    .describe(
      'Nova senha (mínimo 8 caracteres, deve conter ao menos uma maiúscula e um número)',
    ),
});
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
