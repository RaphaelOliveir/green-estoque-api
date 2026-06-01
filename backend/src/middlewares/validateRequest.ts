import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware de validação genérico.
 * Recebe um schema Zod e valida req.body.
 * Em caso de falha, retorna 422 com os erros de forma padronizada.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // result.error é garantido quando success = false
      const flat = result.error!.flatten();
      const detalhes = Object.entries(flat.fieldErrors).map(([campo, msgs]) => ({
        campo,
        mensagem: (msgs as string[])[0] ?? 'Valor inválido',
      }));
      res.status(422).json({ error: 'Dados inválidos', detalhes });
      return;
    }
    req.body = result.data;
    next();
  };
}
