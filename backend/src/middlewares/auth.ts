import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';

export interface JwtPayload {
  id:     number;
  email:  string;
  perfil: 'admin' | 'funcionario';
}

// Extensão do Request para injetar o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// authGuard — extrai e valida Bearer token, injeta req.user
export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(createError('Token não fornecido', 401));
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(createError('Token inválido ou expirado', 401));
  }
}

// roleGuard — verifica se req.user.perfil bate com o perfil exigido
export function roleGuard(perfil: 'admin' | 'funcionario') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Não autenticado', 401));
    }
    if (req.user.perfil !== perfil) {
      return next(createError('Acesso negado: permissão insuficiente', 403));
    }
    next();
  };
}


