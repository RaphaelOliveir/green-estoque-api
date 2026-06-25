import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100)
    .describe('Nome completo do usuário'),
  email: z
    .string()
    .email('E-mail inválido')
    .describe('Endereço de e-mail do usuário'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número')
    .describe(
      'Senha (mínimo 8 caracteres, deve conter ao menos uma maiúscula e um número)',
    ),
  role: z
    .enum(['ENGINEERING', 'FINANCE'])
    .optional()
    .describe('Papel do usuário no sistema'),
});
export class CreateUserDto extends createZodDto(CreateUserSchema) {}
