import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .optional(),
  role: z.enum(['ADMIN', 'OPERATOR']).optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
