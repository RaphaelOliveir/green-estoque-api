import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const LoginSchema = z
  .object({
    email: z
      .string()
      .email({ message: 'E-mail inválido' })
      .describe('Endereço de e-mail do usuário'),
    password: z
      .string()
      .min(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
      .describe('Senha do usuário'),
  })
;

export class LoginDto extends createZodDto(LoginSchema) {}
