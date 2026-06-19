import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateItemStatusSchema = z.object({
  status: z.enum(['EM_ESTOQUE', 'INSTALADO']),
  observations: z.string().max(500).optional(),
});

export class UpdateItemStatusDto extends createZodDto(UpdateItemStatusSchema) {}
