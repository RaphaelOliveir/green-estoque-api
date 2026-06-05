import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

// Middleware global de erro — deve ser o ÚLTIMO middleware registrado
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status  = err.statusCode ?? 500;
  const message = err.message   || 'Erro interno do servidor';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${status}] ${message}`, err.stack);
  }

  res.status(status).json({ error: message });
}

// Cria um erro com statusCode personalizado
export function createError(message: string, statusCode: number): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  return err;
}


